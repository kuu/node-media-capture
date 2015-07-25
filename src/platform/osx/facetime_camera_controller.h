#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@interface FaceTimeCameraController : NSObject <AVCaptureVideoDataOutputSampleBufferDelegate>
{
}
- (id) initWithDeviceId:(NSString *) deviceId frameRate:(Float64) frameRate width:(int) width height:(int) height;
- (void) start;
- (void) pause;
- (void) teardownVideoCapture;
- (void) getFrameData:(
  void (^)(
    const uint8_t * const, size_t,
    const uint8_t * const, const size_t,
    const uint8_t * const, const size_t,
    const size_t * const, const size_t
  )) callback;
@end
