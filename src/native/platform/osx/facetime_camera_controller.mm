#import "facetime_camera_controller.h"
#include "h264_encoder.h"

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
  H264Encoder *encoder;
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
  encoder = new H264Encoder(width, height, 30, 5000, true, 0);

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

const int kFrameNum = 30;

- (void)captureOutput:(AVCaptureOutput *)captureOutput didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection
{   
  if (isPaused) {
    return;
  }

  // got an image
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);

  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
     
  //unsigned char *baseAddress = (unsigned char *)CVPixelBufferGetBaseAddress(pixelBuffer);
  int bufferSize = CVPixelBufferGetDataSize(pixelBuffer);
  //int width = CVPixelBufferGetWidth(pixelBuffer);
  //int height = CVPixelBufferGetHeight(pixelBuffer);
  //NSData *data = [NSData dataWithBytes:baseAddress length:bufferSize];

  // Encode one frame.
  encoder->pushBuffer((const unsigned char *) pixelBuffer, bufferSize, 0);

  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

  if (++frameCounter >= kFrameNum) {
    [self flushEncoder];
    frameCounter = 0;
  }
}

- (int) flushEncoder
{
  encoder->flushCompressedData(self);
  return 0;
}

static void termEncoder() {
}

@end
