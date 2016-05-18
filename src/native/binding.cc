#include <iostream>
#include <sstream>
#include <type_traits>
#include "binding.h"
#include "device_manager.h"

using v8::Value;
using v8::String;
using v8::Number;
using v8::Boolean;
using v8::Object;
using v8::Function;
using v8::FunctionTemplate;
using v8::Array;
using v8::Handle;
using v8::Local;
using v8::Persistent;

const DeviceManager * const deviceManager = DeviceManager::getInstance();

NAN_METHOD(GetSupportedCodecs) {

  const std::vector<const Device*> devices = deviceManager->getDevices();
  std::vector<std::string> supportedCodecs;

  for (unsigned i = 0; i < devices.size(); i++) {
    std::vector<std::string> codecs = devices[i]->GetSupportedCodecs();
    for (unsigned j = 0; j < codecs.size(); j++) {
      supportedCodecs.push_back(codecs[j]);
    }
  }

  const int MIME_TYPES_NUM = supportedCodecs.size();
  Local<Array> array = Nan::New<Array>(MIME_TYPES_NUM);
  for (int i = 0; i < MIME_TYPES_NUM; i++) {
    array->Set(i, Nan::New(supportedCodecs[i]).ToLocalChecked());
  }
  info.GetReturnValue().Set(array);
}

NAN_METHOD(GetSupportedConstraints) {
  const std::vector<const Device*> devices = deviceManager->getDevices();
  std::vector<std::string> supportedConstraints;

  for (unsigned i = 0; i < devices.size(); i++) {
    std::vector<EConstraints> constraints = devices[i]->GetSupportedConstraints();
    for (unsigned j = 0; j < constraints.size(); j++) {
      supportedConstraints.push_back(CONSTRAINTS_STRING[constraints[j]]);
    }
  }

  Local<Object> obj = Nan::New<Object>();
  for (unsigned i = 0; i < supportedConstraints.size(); i++) {
    obj->Set(Nan::New(supportedConstraints[i]).ToLocalChecked(), Nan::True()); 
  }
  info.GetReturnValue().Set(obj);
}

template <typename T>
const std::string& getCapabilityValueString(const struct CapabilityValue<T>& value) {
  std::ostringstream stream;

  if (!value.values.empty()) {
    std::vector<T> values = value.values;
    unsigned size = values.size();
    stream << "\"oneOf\": [";
    for (unsigned i = 0; i < size; i++) {
      if (std::is_same<T, std::string>::value) {
        stream << "\"" << values[i] << "\"";
      } else {
        stream << values[i];
      }
      if (i < size - 1) {
        stream << ",";
      }
    }
    stream << "],";
  } else {
    stream << "\"min\": " << value.min << ",";
    stream << "\"max\": " << value.max << ",";
  }

  if (std::is_same<T, std::string>::value) {
    stream << "\"defaultValue\": \"" << value.defaultValue << "\"";
  } else {
    stream << "\"defaultValue\": " << value.defaultValue;
  }

  std::string s1 = stream.str();
  std::string *s2 = new std::string(s1.c_str(), s1.length());
  
  return *s2;
}

const std::string &getCapabilitiesString(const std::vector<const Capability*> capabilities) {
  std::ostringstream stream;
  unsigned size = capabilities.size();

  stream << "{";

  for (unsigned i = 0; i < size; i++) {

    const Capability::CapabilityTypedValue& value = capabilities[i]->value;
    EConstraints key = capabilities[i]->key;

    stream << "\"" << CONSTRAINTS_STRING[key] << "\" : {";

    switch (key) {
    case EConstraintWidth:
    case EConstraintHeight:
    case EConstraintSampleRate:
    case EConstraintSampleSize:
      stream << getCapabilityValueString<long>(value.l);
      break;
    case EConstraintAspectRatio:
    case EConstraintFrameRate:
    case EConstraintVolume:
    case EConstraintChannelCount:
      stream << getCapabilityValueString<double>(value.d);
      break;
    case EConstraintFacingMode:
      stream << getCapabilityValueString<std::string>(value.s);
      break;
    case EConstraintEchoCancellation:
      stream << getCapabilityValueString<bool>(value.b);
      break;
    default:
      break;
    }
    stream << "}";
    if (i < size - 1) {
      stream << ",";
    } else {
      stream << "";
    }
  }

  stream << "}";

  std::string s1 = stream.str();
  std::string *s2 = new std::string(s1.c_str(), s1.length());
  
  return *s2;
}

struct KeyValue {
  const std::string& key;
  const std::string& value;
};

static const std::string deviceIdStr("deviceId");
static const std::string kindStr("kind");
static const std::string labelStr("label");
static const std::string groupIdStr("groupId");
static const std::string capabilitiesStr("capabilities");

std::vector<const KeyValue*>& getKeyValues(const MediaDeviceInfo *info) {
  std::vector<const KeyValue*> *keyValues = new std::vector<const KeyValue*>();

  const KeyValue *deviceInfo = new KeyValue{deviceIdStr, info->deviceId};
  keyValues->push_back(deviceInfo);
  
  const KeyValue *kind = new KeyValue{kindStr, DEVICE_KIND_STRING[info->kind]};
  keyValues->push_back(kind);
  
  const KeyValue *label = new KeyValue{labelStr, info->label};
  keyValues->push_back(label);
  
  const KeyValue *groupId = new KeyValue{groupIdStr, info->groupId};
  keyValues->push_back(groupId);

  const KeyValue *capabilities = new KeyValue{capabilitiesStr, getCapabilitiesString(info->capabilities)};
  keyValues->push_back(capabilities);

  return *keyValues;
}

NAN_METHOD(GetAvailableDeviceInfo) {
  const std::vector<const Device*> devices = deviceManager->getDevices();

  Local<Array> array = Nan::New<Array>(devices.size());
  for (unsigned i = 0; i < devices.size(); i++) {
    Local<Object> obj = Nan::New<Object>();
    std::vector<const KeyValue*>& keyValueList = getKeyValues(devices[i]->GetDeviceInfo());
    for (unsigned j = 0; j < keyValueList.size(); j++) {
      obj->Set(Nan::New(keyValueList[j]->key.c_str()).ToLocalChecked(), Nan::New(keyValueList[j]->value.c_str()).ToLocalChecked());
    }
    array->Set(i, obj);
  }
  info.GetReturnValue().Set(array);
}

const std::vector<const Constraint *>& convertToConstraint(Local<Object> ecmaObj) {
  Local<Value> value;
  std::vector<const Constraint *> *constraints = new std::vector<const Constraint *>();

  if (!(value = ecmaObj->Get(Nan::New("width").ToLocalChecked()))->IsUndefined()) {
    uint32_t width = value->Uint32Value();
    constraints->push_back(
      new Constraint {
        EConstraintWidth,
        {
          .l = width
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("height").ToLocalChecked()))->IsUndefined()) {
    uint32_t height = value->Uint32Value();
    constraints->push_back(
      new Constraint {
        EConstraintHeight,
        {
          .l = height
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("aspectRatio").ToLocalChecked()))->IsUndefined()) {
    double aspectRatio = value->NumberValue();
    constraints->push_back(
      new Constraint {
        EConstraintAspectRatio,
        {
          .d = aspectRatio
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("frameRate").ToLocalChecked()))->IsUndefined()) {
    double frameRate = value->NumberValue();
    constraints->push_back(
      new Constraint {
        EConstraintFrameRate,
        {
          .d = frameRate
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("facingMode").ToLocalChecked()))->IsUndefined()) {
    std::string facingMode(*String::Utf8Value(value));
    constraints->push_back(
      new Constraint {
        EConstraintFacingMode,
        {
          .s = facingMode
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("volume").ToLocalChecked()))->IsUndefined()) {
    double volume = value->NumberValue();
    constraints->push_back(
      new Constraint {
        EConstraintVolume,
        {
          .d = volume
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("sampleRate").ToLocalChecked()))->IsUndefined()) {
    uint32_t sampleRate = value->Uint32Value();
    constraints->push_back(
      new Constraint {
        EConstraintSampleRate,
        {
          .l = sampleRate
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("sampleSize").ToLocalChecked()))->IsUndefined()) {
    uint32_t sampleSize = value->Uint32Value();
    constraints->push_back(
      new Constraint {
        EConstraintSampleSize,
        {
          .l = sampleSize
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("channelCount").ToLocalChecked()))->IsUndefined()) {
    double channelCount = value->NumberValue();
    constraints->push_back(
      new Constraint {
        EConstraintChannelCount,
        {
          .d = channelCount
        }
      }
    );
  }

  if (!(value = ecmaObj->Get(Nan::New("echoCancellation").ToLocalChecked()))->IsUndefined()) {
    bool echoCancellation = value->BooleanValue();
    constraints->push_back(
      new Constraint {
        EConstraintEchoCancellation,
        {
          .b = echoCancellation
        }
      }
    );
  }
  return *constraints;
}

static Nan::Callback *callback;

static Local<Object> createErrorObject(const char *name, const char *message) {
  Local<Object> obj = Nan::New<Object>();
  obj->Set(Nan::New("name").ToLocalChecked(), Nan::New(name).ToLocalChecked());
  obj->Set(Nan::New("message").ToLocalChecked(), Nan::New(message).ToLocalChecked());
  return obj;
}

void initDeviceCallback(const bool error) {
  if (error) {
    Local<Value> argv[] = {
      createErrorObject("AbortError", "Unable to initialize hardware."),
      Nan::Null(),
    };
    callback->Call(2, argv);
  } else {
    Local<Value> argv[] = {
      Nan::Null(),
      Nan::New<Boolean>(error)
    };
    callback->Call(2, argv);
  }
}

//initDevice(deviceId, settings, cb)
NAN_METHOD(InitDevice) {
  const Nan::Utf8String *deviceIdStr = new Nan::Utf8String(info[0]);
  std::string deviceId(**deviceIdStr);
  const std::vector<const Constraint *>& settings = convertToConstraint(info[1].As<Object>());

  callback = new Nan::Callback(info[2].As<Function>());

  const Device* device = deviceManager->getDevice(deviceId);
  if (device) {
    device->InitDevice(settings, initDeviceCallback);
  }
  info.GetReturnValue().Set(Nan::Undefined());
}

//startDevice(deviceId)
NAN_METHOD(StartDevice) {
  const Nan::Utf8String *deviceIdStr = new Nan::Utf8String(info[0]);
  std::string deviceId(**deviceIdStr);

  const Device* device = deviceManager->getDevice(deviceId);
  if (device) {
    device->StartDevice();
  }
  info.GetReturnValue().Set(Nan::Undefined());
}

static Handle<Object> deviceData;
static bool theresBufferToSend = false;

Handle<Array> getSamplesArray(const std::vector<const Sample*> samples) {
  Local<Array> array = Nan::New<Array>(samples.size());
  for (unsigned i = 0; i < samples.size(); i++) {
    Local<Object> obj = Nan::New<Object>();
    obj->Set(Nan::New("size").ToLocalChecked(), Nan::New<Number>(samples[i]->size));
    //obj->Set(Nan::New("compositionTimeOffset").ToLocalChecked(), Nan::New<Number>(samples[i]->timeDelta));
    array->Set(i, obj);
  }
  return array;
}

Handle<Object> getMetadataObject(const Metadata** metadata, const size_t metaLength) {
  Local<Object> obj = Nan::New<Object>();

  for (unsigned i = 0; i < metaLength; i++) {
    const Metadata *meta = metadata[i];
    const Metadata::MetadataValue& value = meta->value;
    EMetadataKey key = meta->key;

    switch (key) {
    case EMetadataSPS:
    case EMetadataPPS:
      obj->Set(Nan::New(key == EMetadataSPS ? "sps" : "pps").ToLocalChecked(), Nan::NewBuffer((char*)value.p, meta->size).ToLocalChecked());
      break;
    case EMetadataSamples:
      obj->Set(Nan::New("samples").ToLocalChecked(), getSamplesArray(value.arr));
      break;
    case EMetadataTimescale:
      obj->Set(Nan::New("timeScale").ToLocalChecked(), Nan::New<Number>(value.l));
      break;
    case EMetadataBaseTimeOffset:
      obj->Set(Nan::New("pts").ToLocalChecked(), Nan::New<Number>(value.ll));
      break;
    }
  }

  return obj;
}

static void onData(const void * const data, size_t length, const Metadata** metadata, const size_t metaLength) {
  if (length > 0) {
    if (theresBufferToSend) {
      deviceData.Clear();
    }

    deviceData = Nan::New<Object>();
    deviceData->Set(Nan::New("data").ToLocalChecked(), Nan::NewBuffer((char*)data, length).ToLocalChecked());
    deviceData->Set(Nan::New("metadata").ToLocalChecked(), getMetadataObject(metadata, metaLength));
    theresBufferToSend = true;
  }
}

//fetchDevice()
NAN_METHOD(FetchDevice) {
  const Nan::Utf8String *deviceIdStr = new Nan::Utf8String(info[0]);
  std::string deviceId(**deviceIdStr);

  const Device* device = deviceManager->getDevice(deviceId);
  if (!device) {
    info.GetReturnValue().Set(Nan::Undefined());
  } else {
    device->FetchDevice(onData);
    if (theresBufferToSend) {
      theresBufferToSend = false;
      info.GetReturnValue().Set(deviceData);
    } else {
      info.GetReturnValue().Set(Nan::Undefined());
    }
  }
}

//stopDevice(deviceId)
NAN_METHOD(StopDevice) {
  info.GetReturnValue().Set(Nan::Undefined());
}

//pauseDevice(deviceId)
NAN_METHOD(PauseDevice) {
  info.GetReturnValue().Set(Nan::Undefined());
}

//resumeDevice(deviceId)
NAN_METHOD(ResumeDevice) {
  info.GetReturnValue().Set(Nan::Undefined());
}

//configureDevice(deviceId, settings)
NAN_METHOD(ConfigureDevice) {
  info.GetReturnValue().Set(Nan::Undefined());
}

//takeSnapshot(deviceId)
NAN_METHOD(TakeSnapshot) {
  const Nan::Utf8String *deviceIdStr = new Nan::Utf8String(info[0]);
  std::string deviceId(**deviceIdStr);

  const Device* device = deviceManager->getDevice(deviceId);
  if (device) {
    device->TakeSnapshot();
  }
  info.GetReturnValue().Set(Nan::Undefined());
}

//getZeroInformationContent(deviceId)
NAN_METHOD(GetZeroInformationContent) {
  info.GetReturnValue().Set(Nan::Undefined());
}

void Init(Local<Object> exports) {
  exports->Set(Nan::New("getSupportedCodecs").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(GetSupportedCodecs)->GetFunction());
  exports->Set(Nan::New("getSupportedConstraints").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(GetSupportedConstraints)->GetFunction());
  exports->Set(Nan::New("getAvailableDeviceInfo").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(GetAvailableDeviceInfo)->GetFunction());
  exports->Set(Nan::New("initDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(InitDevice)->GetFunction());
  exports->Set(Nan::New("startDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(StartDevice)->GetFunction());
  exports->Set(Nan::New("fetchDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(FetchDevice)->GetFunction());
  exports->Set(Nan::New("stopDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(StopDevice)->GetFunction());
  exports->Set(Nan::New("pauseDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(PauseDevice)->GetFunction());
  exports->Set(Nan::New("resumeDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(ResumeDevice)->GetFunction());
  exports->Set(Nan::New("configureDevice").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(ConfigureDevice)->GetFunction());
  exports->Set(Nan::New("takeSnapshot").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(TakeSnapshot)->GetFunction());
  exports->Set(Nan::New("getZeroInformationContent").ToLocalChecked(),
			      Nan::New<FunctionTemplate>(GetZeroInformationContent)->GetFunction());
}

NODE_MODULE(addon, Init)
