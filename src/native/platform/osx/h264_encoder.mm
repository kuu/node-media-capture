#include <mutex>
#import <CoreFoundation/CoreFoundation.h>
#import <CoreVideo/CoreVideo.h>
#include <VideoToolbox/VideoToolbox.h>

#include "h264_encoder.h"

static CMTimeValue s_forcedKeyframePTS = 0;

static std::mutex m_encodeMutex;

void vtCallback(void *outputCallbackRefCon,
                void *sourceFrameRefCon,
                OSStatus status,
                VTEncodeInfoFlags infoFlags,
                CMSampleBufferRef sampleBuffer )
{
  CMBlockBufferRef block = CMSampleBufferGetDataBuffer(sampleBuffer);
  CFArrayRef attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, false);
  CMTime pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer);
  CMTime dts = CMSampleBufferGetDecodeTimeStamp(sampleBuffer);

  //printf("status: %d\n", (int) status);
  bool isKeyframe = false;
  if (attachments != NULL) {
    CFDictionaryRef attachment;
    CFBooleanRef dependsOnOthers;
    attachment = (CFDictionaryRef)CFArrayGetValueAtIndex(attachments, 0);
    dependsOnOthers = (CFBooleanRef)CFDictionaryGetValue(attachment, kCMSampleAttachmentKey_DependsOnOthers);
    isKeyframe = (dependsOnOthers == kCFBooleanFalse);
  }
        
  if (isKeyframe) {
    // Send the SPS and PPS.
    CMFormatDescriptionRef format = CMSampleBufferGetFormatDescription(sampleBuffer);
    size_t spsSize, ppsSize;
    size_t parmCount;
    const uint8_t* sps, *pps;

    CMVideoFormatDescriptionGetH264ParameterSetAtIndex(format, 0, &sps, &spsSize, &parmCount, nullptr );
    CMVideoFormatDescriptionGetH264ParameterSetAtIndex(format, 1, &pps, &ppsSize, &parmCount, nullptr );

    std::unique_ptr<uint8_t[]> sps_buf (new uint8_t[spsSize + 4]) ;
    std::unique_ptr<uint8_t[]> pps_buf (new uint8_t[ppsSize + 4]) ;

    memcpy(&sps_buf[4], sps, spsSize);
    spsSize+=4 ;
    memcpy(&sps_buf[0], &spsSize, 4);
    memcpy(&pps_buf[4], pps, ppsSize);
    ppsSize += 4;
    memcpy(&pps_buf[0], &ppsSize, 4);

    ((H264Encoder*)outputCallbackRefCon)->compressionSessionOutput(ENALUnitSPS, (uint8_t*)sps_buf.get(),spsSize, pts.value, dts.value);
    ((H264Encoder*)outputCallbackRefCon)->compressionSessionOutput(ENALUnitPPS, (uint8_t*)pps_buf.get(),ppsSize, pts.value, dts.value);
  }
        
  char* bufferData;
  size_t size;
  CMBlockBufferGetDataPointer(block, 0, NULL, &size, &bufferData);

  ((H264Encoder*)outputCallbackRefCon)->compressionSessionOutput(ENALUnitFrame, (uint8_t*)bufferData,size, pts.value, dts.value);
}

H264Encoder::H264Encoder(int frame_w, int frame_h, int fps, int bitrate, bool useBaseline, int ctsOffset)
 : m_frameW(frame_w), m_frameH(frame_h), m_fps(fps), m_bitrate(bitrate), m_ctsOffset(ctsOffset), m_forceKeyframe(false),
  sps(nullptr), spsLen(0), pps(nullptr), ppsLen(0),
  samples((const uint8_t **)malloc(sizeof(uint8_t*) * DEFAULT_SAMPLE_COUNT)),
  sampleByteLength(0),
  sampleSizeList((size_t *)malloc(sizeof(size_t) * DEFAULT_SAMPLE_COUNT)),
  sampleCount(0), maxSampleCount(DEFAULT_SAMPLE_COUNT)
{
  setupCompressionSession(useBaseline);
}

H264Encoder::~H264Encoder()
{
  teardownCompressionSession();
}

CVPixelBufferPoolRef H264Encoder::pixelBufferPool() {
  if (m_compressionSession) {
    return VTCompressionSessionGetPixelBufferPool((VTCompressionSessionRef)m_compressionSession);
  }
  return nullptr;
}

void H264Encoder::pushBuffer(const uint8_t *const data, size_t size, int timestampDelta)
{
  if (m_compressionSession) {
    m_encodeMutex.lock();
    VTCompressionSessionRef session = (VTCompressionSessionRef)m_compressionSession;

    CMTime pts = CMTimeMake(timestampDelta + m_ctsOffset, 1000.); // timestamp is in ms.
    CMTime dur = CMTimeMake(1, m_fps);
    VTEncodeInfoFlags flags;

    CFMutableDictionaryRef frameProps = NULL;

    if (m_forceKeyframe) {
      s_forcedKeyframePTS = pts.value;

      frameProps = CFDictionaryCreateMutable(kCFAllocatorDefault, 1,&kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);

      CFDictionaryAddValue(frameProps, kVTEncodeFrameOptionKey_ForceKeyFrame, kCFBooleanTrue);
    }

    VTCompressionSessionEncodeFrame(session, (CVPixelBufferRef)data, pts, dur, frameProps, NULL, &flags);

    if (m_forceKeyframe) {
      CFRelease(frameProps);
      m_forceKeyframe = false;
    }

    m_encodeMutex.unlock();
  }
}

void H264Encoder::setBitrate(int bitrate)
{
  if (bitrate == m_bitrate) {
    return;
  }
  m_bitrate = bitrate;

  if (m_compressionSession) {
    m_encodeMutex.lock();

    int v = m_bitrate;
    CFNumberRef ref = CFNumberCreate(NULL, kCFNumberSInt32Type, &v);

    //VTCompressionSessionCompleteFrames((VTCompressionSessionRef)m_compressionSession, kCMTimeInvalid);

    OSStatus ret = VTSessionSetProperty((VTCompressionSessionRef)m_compressionSession, kVTCompressionPropertyKey_AverageBitRate, ref);

    if (ret != noErr) {
      printf("H264Encoder::setBitrate Error setting bitrate! %d\n", (int) ret);
    }
    CFRelease(ref);
    ret = VTSessionCopyProperty((VTCompressionSessionRef)m_compressionSession, kVTCompressionPropertyKey_AverageBitRate, kCFAllocatorDefault, &ref);

    if (ret == noErr && ref) {
      SInt32 br = 0;

      CFNumberGetValue(ref, kCFNumberSInt32Type, &br);

      m_bitrate = br;
      CFRelease(ref);
    } else {
      m_bitrate = v;
    }
    v = bitrate / 8;
    CFNumberRef bytes = CFNumberCreate(kCFAllocatorDefault, kCFNumberSInt32Type, &v);
    v = 1;
    CFNumberRef duration = CFNumberCreate(kCFAllocatorDefault, kCFNumberSInt32Type, &v);

    CFMutableArrayRef limit = CFArrayCreateMutable(kCFAllocatorDefault, 2, &kCFTypeArrayCallBacks);

    CFArrayAppendValue(limit, bytes);
    CFArrayAppendValue(limit, duration);

    VTSessionSetProperty((VTCompressionSessionRef)m_compressionSession, kVTCompressionPropertyKey_DataRateLimits, limit);
    CFRelease(bytes);
    CFRelease(duration);
    CFRelease(limit);

    m_encodeMutex.unlock();
  }
}

void H264Encoder::requestKeyframe()
{
  m_forceKeyframe = true;
}

void H264Encoder::compressionSessionOutput(ENALUnitType type, const uint8_t *data, size_t size, uint64_t pts, uint64_t dts)
{
  m_encodeMutex.lock();

  switch (type) {
  case ENALUnitSPS:
    sps = data;
    spsLen = size;
    break;
  case ENALUnitPPS:
    pps = data;
    ppsLen = size;
    break;
  case ENALUnitFrame:
    addEntry(data, size);
    break;
  }

  m_encodeMutex.unlock();
}

void H264Encoder::addEntry(const uint8_t *data, size_t size)
{
  samples[sampleCount] = data;
  sampleSizeList[sampleCount] = size;
  sampleByteLength += size;
  if (++sampleCount >= maxSampleCount) {
    maxSampleCount += DEFAULT_SAMPLE_COUNT;
    samples = (const uint8_t **)realloc((void *)samples, sizeof(uint8_t*) * maxSampleCount);
    sampleSizeList = (size_t *)realloc((void *)sampleSizeList, sizeof(size_t) * maxSampleCount);
  }
}

void H264Encoder::flushCompressedData(void *client)
{
  m_encodeMutex.lock();

  const uint8_t *buf, *p_buf;
  buf = (const uint8_t*)malloc(sampleByteLength);
  p_buf =buf;
  for (int i = 0; i < sampleCount; i++) {
    int len = sampleSizeList[i];
    memcpy((void *)p_buf, samples[i], len);
    p_buf += len;
  }

  [(id)client  setFrameData:(const void *) buf
    length: sampleByteLength
    spsData: sps
    spsDataLength: spsLen
    ppsData: pps
    ppsDataLength: ppsLen
    sampleList: sampleSizeList
    sampleListLength: sampleCount
  ];

  sps = nullptr;
  spsLen = 0;
  pps = nullptr;
  ppsLen = 0;

  sampleCount = 0;
  maxSampleCount = DEFAULT_SAMPLE_COUNT;

  sampleByteLength = 0;
  samples = (const uint8_t **)malloc(sizeof(uint8_t*) * maxSampleCount);
  sampleSizeList = (size_t *)malloc(sizeof(size_t) * maxSampleCount);

  m_encodeMutex.unlock();
}

void H264Encoder::setupCompressionSession(bool useBaseline)
{
  m_baseline = useBaseline;

  // Parts of this code pulled from https://github.com/galad87/HandBrake-QuickSync-Mac/blob/2c1332958f7095c640cbcbcb45ffc955739d5945/libhb/platform/macosx/encvt_h264.c
  // More info from WWDC 2014 Session 513

  m_encodeMutex.lock();
  OSStatus err = noErr;
  CFMutableDictionaryRef encoderSpecifications = nullptr;

  /** iOS is always hardware-accelerated **/
  CFStringRef key = kVTVideoEncoderSpecification_EncoderID;
  CFStringRef value = CFSTR("com.apple.videotoolbox.videoencoder.h264.gva");

  CFStringRef bkey = CFSTR("EnableHardwareAcceleratedVideoEncoder");
  CFBooleanRef bvalue = kCFBooleanTrue;

  CFStringRef ckey = CFSTR("RequireHardwareAcceleratedVideoEncoder");
  CFBooleanRef cvalue = kCFBooleanTrue;

  encoderSpecifications = CFDictionaryCreateMutable(
          kCFAllocatorDefault,
          3,
          &kCFTypeDictionaryKeyCallBacks,
          &kCFTypeDictionaryValueCallBacks);

  CFDictionaryAddValue(encoderSpecifications, bkey, bvalue);
  CFDictionaryAddValue(encoderSpecifications, ckey, cvalue);
  CFDictionaryAddValue(encoderSpecifications, key, value);

  VTCompressionSessionRef session = nullptr;

  err = VTCompressionSessionCreate(
      kCFAllocatorDefault,
      m_frameW,
      m_frameH,
      kCMVideoCodecType_H264,
      encoderSpecifications,
      NULL,
      NULL,
      &vtCallback,
      this,
      &session);
            
  if (err == noErr) {
    m_compressionSession = session;

    const int32_t v = m_fps * 2; // 2-second kfi

    CFNumberRef ref = CFNumberCreate(NULL, kCFNumberSInt32Type, &v);
    err = VTSessionSetProperty(session, kVTCompressionPropertyKey_MaxKeyFrameInterval, ref);
    CFRelease(ref);
  }

  if (err == noErr) {
    const int v = m_fps;
    CFNumberRef ref = CFNumberCreate(NULL, kCFNumberSInt32Type, &v);
    err = VTSessionSetProperty(session, kVTCompressionPropertyKey_ExpectedFrameRate, ref);
    CFRelease(ref);
  }

  if (err == noErr) {
    CFBooleanRef allowFrameReodering = useBaseline ? kCFBooleanFalse : kCFBooleanTrue;
    err = VTSessionSetProperty(session , kVTCompressionPropertyKey_AllowFrameReordering, allowFrameReodering);
  }

  if (err == noErr) {
    const int v = m_bitrate;
    CFNumberRef ref = CFNumberCreate(NULL, kCFNumberSInt32Type, &v);
    err = VTSessionSetProperty(session, kVTCompressionPropertyKey_AverageBitRate, ref);
    CFRelease(ref);
  }

  if (err == noErr) {
    err = VTSessionSetProperty(session, kVTCompressionPropertyKey_RealTime, kCFBooleanTrue);
  }

  if (err == noErr) {
    CFStringRef profileLevel = useBaseline ? kVTProfileLevel_H264_Baseline_AutoLevel : kVTProfileLevel_H264_Main_AutoLevel;

    err = VTSessionSetProperty(session, kVTCompressionPropertyKey_ProfileLevel, profileLevel);
  }

  if (!useBaseline) {
    VTSessionSetProperty(session, kVTCompressionPropertyKey_H264EntropyMode, kVTH264EntropyMode_CABAC);
  }

  if (err == noErr) {
    VTCompressionSessionPrepareToEncodeFrames(session);
  }

  m_encodeMutex.unlock();
}

void H264Encoder::teardownCompressionSession()
{
  if (m_compressionSession) {
    VTCompressionSessionInvalidate((VTCompressionSessionRef)m_compressionSession);
    CFRelease((VTCompressionSessionRef)m_compressionSession);
  }
}
