#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@interface AVController : NSObject <AVCaptureVideoDataOutputSampleBufferDelegate>
{
  AVCaptureVideoDataOutput *videoDataOutput;
  dispatch_queue_t videoDataOutputQueue;
  int frameCounter;
  BOOL isPaused;
}
 
@end

@interface AVController (InternalMethods)
- (id) init;
- (void) configureCameraForBestFrameRate:(AVCaptureDevice *)device;
- (void) setupVideoCapture:(AVCaptureDevice*)device;
- (void) teardownVideoCapture;
- (void) start;
- (void) pause;
@end
 
@implementation AVController

- (id) init {
  self = [super init];
  if (self) {
    // Initialize self.
    frameCounter = 0;
    isPaused = YES;
  }
  return self;
}

- (void) start {
  NSLog(@"start");
  isPaused = NO;
}

- (void) pause {
  NSLog(@"pause");
  isPaused = YES;
}

- (void) configureCameraForBestFrameRate:(AVCaptureDevice *)device
{
  AVCaptureDeviceFormat *bestFormat = nil;
  AVFrameRateRange *bestFrameRateRange = nil;
  for ( AVCaptureDeviceFormat *format in [device formats] ) {
    for ( AVFrameRateRange *range in format.videoSupportedFrameRateRanges ) {
      if ( !bestFrameRateRange || range.minFrameRate < bestFrameRateRange.minFrameRate ) {
	bestFormat = format;
	bestFrameRateRange = range;
      }
    }
  }
  if ( bestFormat ) {
    if ( [device lockForConfiguration:NULL] == YES ) {
      device.activeFormat = bestFormat;
      device.activeVideoMinFrameDuration = bestFrameRateRange.maxFrameDuration;
      device.activeVideoMaxFrameDuration = bestFrameRateRange.maxFrameDuration;
      NSLog(@"Set frame duration to : %f", CMTimeGetSeconds(bestFrameRateRange.maxFrameDuration));
      [device unlockForConfiguration];
    }
  }
}

- (void)setupAVCapture:(AVCaptureDevice*)device
{
  NSError *error = nil;
    
  AVCaptureSession *session = [AVCaptureSession new];
  [session setSessionPreset:AVCaptureSessionPresetPhoto];
    
  // Select a video device, make an input
  //AVCaptureDevice *device = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeVideo];
  AVCaptureDeviceInput *deviceInput = [AVCaptureDeviceInput deviceInputWithDevice:device error:&error];
  require( error == nil, bail );
    
  if ( [session canAddInput:deviceInput] ) {
    [session addInput:deviceInput];
  } else {
    NSLog(@"Unable to add a deviceInput");
  }
    
  // Make a video data output
  videoDataOutput = [AVCaptureVideoDataOutput new];
    
  // we want BGRA, both CoreGraphics and OpenGL work well with 'BGRA'
  NSDictionary *rgbOutputSettings = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:kCMPixelFormat_32BGRA] forKey:(id)kCVPixelBufferPixelFormatTypeKey];

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

  NSLog(@"Succeded: setupAVCapture");
 
 bail:
  [session release];
  if (error) {
    NSLog(@"Error occurred: setupAVCapture");
  }
}

// clean up capture setup
- (void)teardownAVCapture
{
  [videoDataOutput release];
  if (videoDataOutputQueue)
    dispatch_release(videoDataOutputQueue);
}

const int kFrameNum = 25;

- (void)captureOutput:(AVCaptureOutput *)captureOutput didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection
{   
  if (isPaused) {
    return;
  }

  NSLog(@"captureOutput: Enter.");
  // got an image
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);

  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
     
  unsigned char *baseAddress = (unsigned char *)CVPixelBufferGetBaseAddress(pixelBuffer);
  int bufferSize = CVPixelBufferGetDataSize(pixelBuffer);
  int width = CVPixelBufferGetWidth(pixelBuffer);
  int height = CVPixelBufferGetHeight(pixelBuffer);
  NSData *data = [NSData dataWithBytes:baseAddress length:bufferSize];

  if (encodeFrame(data, width, height, NO) == 0) {
    NSLog(@"Encode: success frame=%d", frameCounter);
  }else{
    NSLog(@"Encode: fail");
    return NO;
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

  if (++frameCounter >= kFrameNum) {
    NSLog(@"will call flushEncoder()");
    flushEncoder();
    frameCounter = 0;
  }
  return YES;
}
@end

#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <x264.h>

int main(void) {
  AVCaptureDevice *camera;
  AVCaptureDevice *microphone;
  NSArray *devices = [AVCaptureDevice devices];

  NSLog(@"Device List:"); 

  for (AVCaptureDevice *device in devices) {

    NSLog(@"-----"); 
    NSLog(@"Device name: %@", [device localizedName]);
 
    if ([device hasMediaType:AVMediaTypeVideo]) {
      NSLog(@"hasMediaType:AVMediaTypeVideo");
 
      if ([device position] == AVCaptureDevicePositionBack) {
	NSLog(@"Device position : back");
      } else {
	NSLog(@"Device position : front");
      }
      camera = device;
    }
    

    if ([device hasMediaType:AVMediaTypeAudio]) {
      NSLog(@"hasMediaType:AVMediaTypeAudio");
      microphone = device;
    }

    if ([device hasMediaType:AVMediaTypeMuxed]) {
      NSLog(@"hasMediaType:AVMediaTypeMuxed");
    }

  }

  if (initEncoder() != 0) {
    return 1;
  }

  AVController *app = [[AVController alloc] init];
  [app configureCameraForBestFrameRate:camera];
  [app setupAVCapture:camera];

  NSLog(@"start");
  [app start];
 
  [NSThread sleepForTimeInterval:5.0f];

  [app pause];

  [NSThread sleepForTimeInterval:1.0f];
  NSLog(@"will call flushEncoder() 2");
  flushEncoder();
  NSLog(@"end");

  return 0;
}

x264_t *encoder;
x264_param_t param;
const int FRAME_WIDTH = 320;
const int FRAME_HEIGHT = 180;
const int luma_size = FRAME_WIDTH * FRAME_HEIGHT;
const int chroma_size = luma_size / 4;

int initEncoder() {
  int ret;

  /* Get default params for preset/tuning */
  if ((ret = x264_param_default_preset(&param, "medium", NULL)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_param_default_preset failed.\n");
    return ret;
  }

  /* Configure non-default params */
  param.i_csp = X264_CSP_I420;
  param.i_width  = FRAME_WIDTH;
  param.i_height = FRAME_HEIGHT;
  param.b_vfr_input = 0;
  param.b_repeat_headers = 1;
  param.b_annexb = 1;

  /* Apply profile restrictions. */
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

char *getPriorityStr(enum nal_priority_e priority) {
  char *str = "undefined";

  switch (priority) {
  case NAL_PRIORITY_DISPOSABLE:
    str = "DISPOSABLE";
    break;
  case NAL_PRIORITY_LOW:
    str = "LOW";
    break;
  case NAL_PRIORITY_HIGH:
    str = "HIGH";
    break;
  case NAL_PRIORITY_HIGHEST:
    str = "HIGHEST";
    break;
  }
  return str;
}

char *getTypeStr(enum nal_unit_type_e type) {
  char *str = "undefined";

  switch (type) {
  case NAL_SLICE:
    str = "Other slice";
    break;
  case NAL_SLICE_DPA:
    str = "DPA slice";
    break;
  case NAL_SLICE_DPB:
    str = "DPB slice";
    break;
  case NAL_SLICE_DPC:
    str = "DPC slice";
    break;
  case NAL_SLICE_IDR:
    str = "IDR slice";
    break;
  case NAL_SEI:
    str = "SEI";
    break;
  case NAL_SPS:
    str = "SPS";
    break;
  case NAL_PPS:
    str = "PPS";
    break;
  case NAL_AUD:
    str = "AU delimiter";
    break;
  case NAL_FILLER:
    str = "Filler data";
    break;
  default:
    str = "Unknown";
  }
  return str;
}

void printNAL(x264_nal_t *nal) {
  printf("NAL unit -----\n");
  printf("\tpriority=%s\n", getPriorityStr(nal->i_ref_idc));
  printf("\ttype=%s\n", getTypeStr(nal->i_type));
  //nal->b_long_startcode;
  //nal->i_first_mb; /* If this NAL is a slice, the index of the first MB in the slice. */
  //nal->i_last_mb;  /* If this NAL is a slice, the index of the last MB in the slice. */
  printf("\tsize of payload=%d\n", nal->i_payload);
  //printf("\tsize of padding=%d\n", nal->i_padding);
}

int convertPixelFormat(const enum AVPixelFormat srcFmt, const int srcW, const int srcH, const uint8_t *srcData, const enum AVPixelFormat dstFmt, const int dstW, const int dstH, x264_image_t *dstData) {
  struct SwsContext *sws_ctx;
  int ret;
  int src_linesize[4];
  uint8_t *src_data[4];

  printf("convertPixelFormat enter.\n");

  sws_ctx = sws_getContext(srcW, srcH, srcFmt,
                           dstW, dstH, dstFmt,
                           SWS_BILINEAR, NULL, NULL, NULL);

  if (!sws_ctx) {
    av_log(NULL, AV_LOG_ERROR, "sws_getContext failed.\n");
    return AVERROR_UNKNOWN;
  }

  printf("sws_getContext done\n");

  if ((ret = av_image_fill_linesizes(src_linesize, srcFmt, srcW)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "av_image_fill_linesizes failed.\n");
    sws_freeContext(sws_ctx);
    return ret;
  }

  printf("av_image_fill_linesizes done\n");

  if ((ret = av_image_fill_pointers(src_data, srcFmt, srcH, (uint8_t *) srcData, src_linesize)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "av_image_fill_pointers failed.\n");
    sws_freeContext(sws_ctx);
    return ret;
  }

  printf("av_image_fill_pointers done\n");

  sws_scale(sws_ctx, (const uint8_t * const*)src_data, src_linesize, 0, srcH, dstData->plane, dstData->i_stride);
  printf("convertPixelFormat done.\n");
  sws_freeContext(sws_ctx);
  return 0;
}

int encodeFrame(const uint8_t *data, const int width, const int height) {
  int ret;
  x264_picture_t pic;
  x264_picture_t pic_out;
  x264_nal_t *nal;
  int i_nal;

  printf("encodeFrame enter %d x %d.\n", width, height);

  if ((ret = x264_picture_alloc(&pic, param.i_csp, param.i_width, param.i_height)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_param_picture_alloc failed.\n");
    return ret;
  }

  printf("x264_picture_alloc done\n");

  if ((ret = convertPixelFormat(AV_PIX_FMT_RGB32, width, height, data, AV_PIX_FMT_YUV420P, FRAME_WIDTH, FRAME_HEIGHT, &pic.img)) < 0) {
    x264_picture_clean(&pic);
    return ret;
  }

  /* Encode frame */
  if ((ret = x264_encoder_encode(encoder, &nal, &i_nal, &pic, &pic_out)) < 0) {
    av_log(NULL, AV_LOG_ERROR, "x264_encoder_encode failed.\n");
    x264_picture_clean(&pic);
    return ret;
  }

  if(ret) {
    printf("1) Got %d NAL units-----\n", i_nal);
    for (int i = 0; i < i_nal; i++) {
      printNAL(nal + i);
    }
    /*
    if (!fwrite(nal->p_payload, i_frame_size, 1, stdout)) {
      goto end;
    }
    */
  } else {
    printf("1) No iframe-----\n");
  }

  x264_picture_clean(&pic);
  printf("encodeFrame succeeded.\n");
  return 0;
}

int flushEncoder() {
  int ret;
  x264_nal_t *nal;
  int i_nal;
  x264_picture_t pic_out;

  printf("flushEncoder enter.\n");

  /* Flush delayed frames */
  while (x264_encoder_delayed_frames(encoder)) {
    if ((ret = x264_encoder_encode(encoder, &nal, &i_nal, NULL, &pic_out)) < 0) {
      av_log(NULL, AV_LOG_ERROR, "x264_encoder_encode failed.\n");
      return ret;
    }

    if (ret) {
      printf("2) Got %d NAL units-----\n", i_nal);
      for (int j = 0; j < i_nal; j++) {
	printNAL(nal + j);
      }
    } else {
      printf("2) No iframe-----\n");
    }
  }
  termEncoder();
  initEncoder();
  printf("flushEncoder done.\n");
}

int termEncoder() {
    x264_encoder_close( encoder );
}
