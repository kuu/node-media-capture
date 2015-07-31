#import "facetime_camera_controller.h"

@interface FaceTimeCameraController () {
  AVCaptureDevice *device;
  AVCaptureVideoDataOutput *videoDataOutput;
  AVCaptureStillImageOutput *stillImageOutput;
  AVCaptureSession *session;
  dispatch_queue_t videoDataOutputQueue;
  int frameCounter;
  BOOL isPaused;
  const uint8_t *frameData;
  size_t frameDataLength;
  const uint8_t *spsData;
  size_t spsDataLength;
  const uint8_t *ppsData;
  size_t ppsDataLength;
  const size_t *sampleList;
  size_t sampleListLength;
  NSLock *frameDataLock;
}
- (void) configureWithFrameRate:(Float64) frameRate;
- (void) configureWithResolution:(NSString *) resolution;
- (void) captureOutput:(AVCaptureOutput *) captureOutput didOutputSampleBuffer:(CMSampleBufferRef) sampleBuffer fromConnection:(AVCaptureConnection *) connection;
- (void) setFrameData:(const uint8_t *) data length:(size_t) length
  spsData:(const uint8_t *) sps spsDataLength:(size_t) spsLength
  ppsData:(const uint8_t *) pps ppsDataLength:(size_t) ppsLength
  sampleList:(const size_t *) samples sampleListLength:(size_t) sampleNum;
@end

@implementation FaceTimeCameraController

static int frameWidth = 0;
static int frameHeight = 0;

- (void) setFrameData:(const uint8_t *) data length:(size_t) length
  spsData:(const uint8_t *) sps spsDataLength:(size_t) spsLength
  ppsData:(const uint8_t *) pps ppsDataLength:(size_t) ppsLength
  sampleList:(const size_t *) samples sampleListLength:(size_t) sampleNum
{
  [frameDataLock lock];

  if (frameData) {
    free((void*) frameData);
  }
  if (spsData) {
    free((void*) spsData);
  }
  if (ppsData) {
    free((void*) ppsData);
  }
  if (sampleList) {
    free((void*) sampleList);
  }
  frameData = data;
  frameDataLength = length;
  spsData = sps;
  spsDataLength = spsLength;
  ppsData = pps;
  ppsDataLength = ppsLength;
  sampleList = samples;
  sampleListLength = sampleNum;
  [frameDataLock unlock];
}

- (void) getFrameData:(
  void (^)(
    const uint8_t * const, size_t,
    const uint8_t * const, const size_t,
    const uint8_t * const, const size_t,
    const size_t * const, const size_t
  )) callback
{
  [frameDataLock lock];
  callback(frameData, frameDataLength, spsData, spsDataLength, ppsData, ppsDataLength, sampleList, sampleListLength);
  frameDataLength = 0;
  [frameDataLock unlock];
}

- (id) initWithDeviceId:(NSString *) deviceId frameRate:(Float64) frameRate width:(int) width height:(int) height
{
  self = [super init];

  if (self == nil) {
    return nil;
  }

  // Get device
  device = [AVCaptureDevice deviceWithUniqueID: deviceId];

  if (device == nil) {
    return nil;
  }

  // Configure device
  [self configureWithFrameRate: frameRate];

  NSString *resolution = nil;
  /*
  if (width == 320 && height == 240) {
    resolution = AVCaptureSessionPreset320x240;
  } else if (width == 352 && height == 288) {
    resolution = AVCaptureSessionPreset352x288;
  } else if (width == 640 && height == 480) {
    resolution = AVCaptureSessionPreset640x480;
  } else if (width == 960 && height == 540) {
    resolution = AVCaptureSessionPreset960x540;
  } else if (width == 1280 && height == 720) {
    resolution = AVCaptureSessionPreset1280x720;
  } else {
  */
    resolution = AVCaptureSessionPresetPhoto;
  //}

  [self configureWithResolution: resolution];

  frameWidth = width;
  frameHeight = height;

  if (videoDataOutput == nil) {
    return nil;
  }

  // Init encoder
  if (initEncoder() != 0) {
    return nil;
  }

  frameCounter = 0;
  isPaused = YES;
  frameData = 0;
  frameDataLength = 0;
  spsData = 0;
  spsDataLength = 0;
  ppsData = 0;
  ppsDataLength = 0;
  sampleList = 0;
  sampleListLength = 0;
  frameDataLock = [[NSLock alloc] init];

  NSLog(@"Succeded: initWithDeviceId");

  return self;
}


- (void) configureWithFrameRate:(Float64) frameRate
{
  AVCaptureDeviceFormat *formatToUse = nil;
  AVFrameRateRange *rangeToUse = nil;
  Float64 distanceToMax = FLT_MAX;
  for (AVCaptureDeviceFormat *format in [device formats]) {
    for (AVFrameRateRange *range in format.videoSupportedFrameRateRanges) {
      if (range.minFrameRate <= frameRate && range.maxFrameRate >= frameRate) {
        Float64 diff = range.maxFrameRate - frameRate;
        if (diff < distanceToMax) {
          formatToUse = format;
          rangeToUse = range;
          distanceToMax = diff;
        }
      }
    }
  }

  if (formatToUse && [device lockForConfiguration:NULL] == YES) {
    device.activeFormat = formatToUse;
    device.activeVideoMinFrameDuration = rangeToUse.minFrameDuration;
    device.activeVideoMaxFrameDuration = rangeToUse.minFrameDuration;
    NSLog(@"Set frame duration to : %f", frameRate);
    [device unlockForConfiguration];
  }
}

- (void) configureWithResolution:(NSString *) resolution
{
  NSError *error = nil;
  NSDictionary *rgbOutputSettings = nil;
  AVCaptureDeviceInput *deviceInput = nil;
    
  session = [AVCaptureSession new];
  [session setSessionPreset: resolution];
  NSLog(@"resolution=%@", resolution);
    
  // Select a video device, make an input
  deviceInput = [AVCaptureDeviceInput deviceInputWithDevice:device error:&error];
  require(error == nil, bail);
    
  if ( [session canAddInput:deviceInput] ) {
    [session addInput:deviceInput];
  } else {
    NSLog(@"Unable to add a deviceInput");
    return;
  }

  stillImageOutput = [[AVCaptureStillImageOutput alloc] init];
  stillImageOutput.outputSettings = @{AVVideoCodecKey : AVVideoCodecJPEG};

  if ([session canAddOutput:stillImageOutput]) {
    [session addOutput:stillImageOutput];
  }
    
  // Make a video data output
  videoDataOutput = [AVCaptureVideoDataOutput new];
    
  // we want BGRA, both CoreGraphics and OpenGL work well with 'BGRA'
  rgbOutputSettings = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:kCMPixelFormat_32BGRA] forKey:(id)kCVPixelBufferPixelFormatTypeKey];

  [videoDataOutput setVideoSettings:rgbOutputSettings];
  [videoDataOutput setAlwaysDiscardsLateVideoFrames:YES]; // discard if the data output queue is blocked (as we process the still image)
    
  // create a serial dispatch queue used for the sample buffer delegate as well as when a still image is captured
  // a serial dispatch queue must be used to guarantee that video frames will be delivered in order
  // see the header doc for setSampleBufferDelegate:queue: for more information
  videoDataOutputQueue = dispatch_queue_create("VideoDataOutputQueue", DISPATCH_QUEUE_SERIAL);
  [videoDataOutput setSampleBufferDelegate:self queue:videoDataOutputQueue];
    
  if ( [session canAddOutput:videoDataOutput] ) {
    [session addOutput:videoDataOutput];
  } else {
    NSLog(@"Unable to add videoDataOutput");
  }

  [[videoDataOutput connectionWithMediaType:AVMediaTypeVideo] setEnabled:YES];

  [session startRunning];

  NSLog(@"Succeded: configureWithResolution");
 
bail:
  [session release];
  if (error) {
    NSLog(@"Error occurred: configureWithResolution");
  }
}

- (void) start
{
  NSLog(@"start");
  isPaused = NO;
}

- (void) pause
{
  NSLog(@"pause");
  isPaused = YES;
}

// clean up capture setup
- (void) teardownVideoCapture
{
  [session stopRunning];
  [videoDataOutput release];
  if (videoDataOutputQueue) {
    dispatch_release(videoDataOutputQueue);
  }
}

- (void) captureStillImage {
  AVCaptureConnection *connection = [stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  id handler = ^(CMSampleBufferRef sampleBuffer, NSError *error) {
    if (sampleBuffer != NULL) {
      NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:sampleBuffer];
      const size_t length = imageData.length;
      const uint8_t *src = (const uint8_t *)imageData.bytes;
      const uint8_t *dst = (const uint8_t *)malloc(sizeof (uint8_t) * length);
      memcpy((void *)dst, src, length);
      [self setFrameData:dst length:length
        spsData:0 spsDataLength:0
        ppsData:0 ppsDataLength:0
        sampleList:0 sampleListLength: 0];
    } else {
      NSLog(@"NULL sampleBuffer: %@", [error localizedDescription]);
    }
  };
  // Capture still image
  [stillImageOutput captureStillImageAsynchronouslyFromConnection:connection completionHandler:handler];
}

const int kFrameNum = 45;

- (void)captureOutput:(AVCaptureOutput *)captureOutput didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection
{   
  if (isPaused) {
    return;
  }

  // got an image
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);

  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
     
  unsigned char *baseAddress = (unsigned char *)CVPixelBufferGetBaseAddress(pixelBuffer);
  int bufferSize = CVPixelBufferGetDataSize(pixelBuffer);
  int width = CVPixelBufferGetWidth(pixelBuffer);
  int height = CVPixelBufferGetHeight(pixelBuffer);
  NSData *data = [NSData dataWithBytes:baseAddress length:bufferSize];

  if (encodeFrame((const unsigned char *)data.bytes, width, height) != 0) {
    NSLog(@"Encode: fail");
    return;
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

  if (++frameCounter >= kFrameNum) {
    [self flushEncoder];
    frameCounter = 0;
  }

#if 0
  if (++frameCounter >= kFrameNum) {
    [self captureStillImage];
    frameCounter = 0;
  }
#endif
}

#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <x264.h>

static x264_t *encoder;
static x264_param_t param;

static int initEncoder() {
  int ret;

  /* Get default params for preset/tuning */
  if ((ret = x264_param_default_preset(&param, "medium", NULL)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_param_default_preset failed.\n");
    return ret;
  }

  /* Configure non-default params */
  param.i_csp = X264_CSP_I420;
  param.i_width  = frameWidth;
  param.i_height = frameHeight;
  param.b_vfr_input = 0;
  param.b_repeat_headers = 1;
  param.b_annexb = 1;
  param.i_log_level = X264_LOG_NONE;

  /* Apply profile restrictions. */
  //if ((ret = x264_param_apply_profile(&param, "high")) < 0) {
  if ((ret = x264_param_apply_profile(&param, "baseline")) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_param_apply_profile failed.\n");
    return ret;
  }

  encoder = x264_encoder_open( &param );
  if (!encoder) {
    return AVERROR_UNKNOWN;
  }

  return 0;
}

#if 0

static const char *getPriorityStr(int priority) {
  switch (priority) {
  case NAL_PRIORITY_DISPOSABLE:
    return "DISPOSABLE";
  case NAL_PRIORITY_LOW:
    return "LOW";
  case NAL_PRIORITY_HIGH:
    return "HIGH";
  case NAL_PRIORITY_HIGHEST:
    return "HIGHEST";
  }
  return "undefined";
}

static const char *getTypeStr(int type) {
  switch (type) {
  case NAL_SLICE:
    return "Other slice";
  case NAL_SLICE_DPA:
    return "DPA slice";
  case NAL_SLICE_DPB:
    return "DPB slice";
  case NAL_SLICE_DPC:
    return "DPC slice";
  case NAL_SLICE_IDR:
    return "IDR slice";
  case NAL_SEI:
    return "SEI";
  case NAL_SPS:
    return "SPS";
  case NAL_PPS:
    return "PPS";
  case NAL_AUD:
    return "AU delimiter";
  case NAL_FILLER:
    return "Filler data";
  case NAL_UNKNOWN:
    return "Unknown";
  }
  return "undefined";
}

static void printNAL(x264_nal_t *nal) {
  printf("NAL unit -----\n");
  printf("\tpriority=%s\n", getPriorityStr(nal->i_ref_idc));
  printf("\ttype=%s\n", getTypeStr(nal->i_type));
  //nal->b_long_startcode;
  //nal->i_first_mb; /* If this NAL is a slice, the index of the first MB in the slice. */
  //nal->i_last_mb;  /* If this NAL is a slice, the index of the last MB in the slice. */
  printf("\tsize of payload=%d\n", nal->i_payload);
  //printf("\tsize of padding=%d\n", nal->i_padding);
}

#endif

static int convertPixelFormat(const enum AVPixelFormat srcFmt, const int srcW, const int srcH, const uint8_t *srcData, const enum AVPixelFormat dstFmt, const int dstW, const int dstH, x264_image_t *dstData) {
  struct SwsContext *sws_ctx;
  int ret;
  int src_linesize[4];
  uint8_t *src_data[4];

  sws_ctx = sws_getContext(srcW, srcH, srcFmt,
                           dstW, dstH, dstFmt,
                           SWS_BILINEAR, NULL, NULL, NULL);

  if (!sws_ctx) {
    av_log(NULL, AV_LOG_ERROR, "sws_getContext failed.\n");
    return AVERROR_UNKNOWN;
  }

  if ((ret = av_image_fill_linesizes(src_linesize, srcFmt, srcW)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "av_image_fill_linesizes failed.\n");
    sws_freeContext(sws_ctx);
    return ret;
  }

  if ((ret = av_image_fill_pointers(src_data, srcFmt, srcH, (uint8_t *) srcData, src_linesize)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "av_image_fill_pointers failed.\n");
    sws_freeContext(sws_ctx);
    return ret;
  }

  sws_scale(sws_ctx, (const uint8_t * const*)src_data, src_linesize, 0, srcH, dstData->plane, dstData->i_stride);
  sws_freeContext(sws_ctx);
  return 0;
}

static int encodeFrame(const uint8_t *data, const int width, const int height) {
  int ret;
  x264_picture_t pic;
  x264_picture_t pic_out;
  x264_nal_t *nal;
  int i_nal;

  if ((ret = x264_picture_alloc(&pic, param.i_csp, param.i_width, param.i_height)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_param_picture_alloc failed.\n");
    return ret;
  }

  //printf("[%d x %d] => [%d x %d]\n", width, height, frameWidth, frameHeight);
  //if ((ret = convertPixelFormat(AV_PIX_FMT_RGB32, width, height, data, AV_PIX_FMT_YUV420P, frameWidth, frameHeight, &pic.img)) < 0) {
  if ((ret = convertPixelFormat(AV_PIX_FMT_BGRA, width, height, data, AV_PIX_FMT_YUV420P, frameWidth, frameHeight, &pic.img)) < 0) {
    x264_picture_clean(&pic);
    return ret;
  }

  /* Encode frame */
  if ((ret = x264_encoder_encode(encoder, &nal, &i_nal, &pic, &pic_out)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_encoder_encode failed.\n");
    x264_picture_clean(&pic);
    return ret;
  }

  /*
  if(ret) {
    printf("1) Got %d NAL units-----\n", i_nal);
    for (int i = 0; i < i_nal; i++) {
      printNAL(nal + i);
    }
  }
  */

  x264_picture_clean(&pic);

  return 0;
}

- (int) flushEncoder
{
  int ret;
  x264_nal_t *nal;
  int i_nal;
  x264_picture_t pic_out;
  int totalPayloadSize = 0;
  const size_t DEFAULT_NAL_COUNT = 50;
  int currentNALCount = 0;
  int maxNALCount = DEFAULT_NAL_COUNT;
  x264_nal_t **nal_list = (x264_nal_t **)malloc(sizeof(x264_nal_t *) * maxNALCount);
  size_t *sample_size_list = (size_t *)malloc(sizeof(size_t) * maxNALCount);
  uint8_t *sps = 0, *pps = 0;
  size_t spsLen = 0, ppsLen = 0;

  /* Flush delayed frames */
  while (x264_encoder_delayed_frames(encoder)) {
    if ((ret = x264_encoder_encode(encoder, &nal, &i_nal, NULL, &pic_out)) < 0) {
      av_log(NULL, AV_LOG_ERROR, "x264_encoder_encode failed.\n");
      return ret;
    }

    if (ret) {
      for (int j = 0; j < i_nal; j++) {
        x264_nal_t *p = nal + j;
        //printNAL(p);
        if (p->i_type == NAL_SPS && !sps) {
          sps = (uint8_t *)malloc(p->i_payload);
          memcpy(sps, p->p_payload, p->i_payload);
          spsLen = p->i_payload;
        } else if (p->i_type == NAL_PPS && !pps) {
          pps = (uint8_t *)malloc(p->i_payload);
          memcpy(pps, p->p_payload, p->i_payload);
          ppsLen = p->i_payload;
	}
        //} else if (p->i_type == NAL_SLICE || p->i_type == NAL_SLICE_IDR) {
          totalPayloadSize += p->i_payload;
          nal_list[currentNALCount] = p;
          sample_size_list[currentNALCount++] = p->i_payload;
	//}

        if (maxNALCount <= currentNALCount) {
          maxNALCount += DEFAULT_NAL_COUNT;
          nal_list = (x264_nal_t **)realloc(nal_list, sizeof(x264_nal_t *) * maxNALCount);
          sample_size_list = (size_t *)realloc(sample_size_list, sizeof(size_t) * maxNALCount);
        }
      }
    }
  }

  if (totalPayloadSize > 0) {
    uint8_t *buf = (uint8_t *)malloc(totalPayloadSize);
    uint8_t *p_buf = buf;
    for (int i = 0; i < currentNALCount; i++) {
      memcpy(p_buf, nal_list[i]->p_payload, nal_list[i]->i_payload);
      p_buf += nal_list[i]->i_payload;
    }
    printf("%d NAL units were captured. size=%d\n", currentNALCount, totalPayloadSize);

    [self setFrameData:(const void *) buf
      length: totalPayloadSize
      spsData: sps
      spsDataLength: spsLen
      ppsData: pps
      ppsDataLength: ppsLen
      sampleList: sample_size_list
      sampleListLength: currentNALCount
    ];
  }

  free((void*)nal_list);

  termEncoder();
  initEncoder();

  return 0;
}

static void termEncoder() {
  x264_encoder_close( encoder );
}

@end
