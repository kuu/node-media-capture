#ifndef NATIVE_EXTENSION_GRAB_H
#define NATIVE_EXTENSION_GRAB_H

#include <nan.h>

NAN_METHOD(GetSupportedCodecs);
NAN_METHOD(GetSupportedConstraints);
NAN_METHOD(GetAvailableDeviceInfo);
NAN_METHOD(InitDevice);
NAN_METHOD(StartDevice);
NAN_METHOD(FetchDevice);
NAN_METHOD(StopDevice);
NAN_METHOD(PauseDevice);
NAN_METHOD(ResumeDevice);
NAN_METHOD(ConfigureDevice);
NAN_METHOD(GetZeroInformationContent);

#endif
