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
  NanScope();
  const std::vector<const Device*> devices = deviceManager->getDevices();
  std::vector<std::string> supportedCodecs;

  for (unsigned i = 0; i < devices.size(); i++) {
    std::vector<std::string> codecs = devices[i]->GetSupportedCodecs();
    for (unsigned j = 0; j < codecs.size(); j++) {
      supportedCodecs.push_back(codecs[j]);
    }
  }

  const int MIME_TYPES_NUM = supportedCodecs.size();
  Local<Array> array = NanNew<Array>(MIME_TYPES_NUM);
  for (int i = 0; i < MIME_TYPES_NUM; i++) {
    array->Set(i, NanNew<String>(supportedCodecs[i]));
  }
  NanReturnValue(array);
}

NAN_METHOD(GetSupportedConstraints) {
  NanScope();
  const std::vector<const Device*> devices = deviceManager->getDevices();
  std::vector<std::string> supportedConstraints;

  for (unsigned i = 0; i < devices.size(); i++) {
    std::vector<EConstraints> constraints = devices[i]->GetSupportedConstraints();
    for (unsigned j = 0; j < constraints.size(); j++) {
      supportedConstraints.push_back(CONSTRAINTS_STRING[constraints[j]]);
    }
  }

  Local<Object> obj = NanNew<Object>();
  for (unsigned i = 0; i < supportedConstraints.size(); i++) {
    obj->Set(NanNew<String>(supportedConstraints[i]), NanTrue()); 
  }
  NanReturnValue(obj);
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
  NanScope();

  const std::vector<const Device*> devices = deviceManager->getDevices();

  Local<Array> array = NanNew<Array>(devices.size());
  for (unsigned i = 0; i < devices.size(); i++) {
    Local<Object> obj = NanNew<Object>();
    std::vector<const KeyValue*>& keyValueList = getKeyValues(devices[i]->GetDeviceInfo());
    for (unsigned j = 0; j < keyValueList.size(); j++) {
      obj->Set(NanNew<String>(keyValueList[j]->key.c_str()), NanNew<String>(keyValueList[j]->value.c_str()));
    }
    array->Set(i, obj);
  }
  NanReturnValue(array);
}

const std::vector<const Constraint *>& convertToConstraint(Local<Object> ecmaObj) {
  Local<Value> value;
  std::vector<const Constraint *> *constraints = new std::vector<const Constraint *>();

  if (!(value = ecmaObj->Get(NanNew<String>("width")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("height")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("aspectRatio")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("frameRate")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("facingMode")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("volume")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("sampleRate")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("sampleSize")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("channelCount")))->IsUndefined()) {
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

  if (!(value = ecmaObj->Get(NanNew<String>("echoCancellation")))->IsUndefined()) {
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

static NanCallback *callback;

static Local<Object> createErrorObject(const char *name, const char *message) {
  Local<Object> obj = NanNew<Object>();
  obj->Set(NanNew<String>("name"), NanNew<String>(name));
  obj->Set(NanNew<String>("message"), NanNew<String>(message));
  return obj;
}

void initDeviceCallback(const bool error) {
  if (error) {
    Local<Value> argv[] = {
      createErrorObject("AbortError", "Unable to initialize hardware."),
      NanNull(),
    };
    callback->Call(2, argv);
  } else {
    Local<Value> argv[] = {
      NanNull(),
      NanNew<Boolean>(error)
    };
    callback->Call(2, argv);
  }
}

//initDevice(deviceId, settings, cb)
NAN_METHOD(InitDevice) {
  NanScope();

  const NanUtf8String *deviceIdStr = new NanUtf8String(args[0]);
  std::string deviceId(**deviceIdStr);
  const std::vector<const Constraint *>& settings = convertToConstraint(args[1].As<Object>());

  callback = new NanCallback(args[2].As<Function>());

  const Device* device = deviceManager->getDevice(deviceId);
  if (device) {
    device->InitDevice(settings, initDeviceCallback);
  }
  NanReturnUndefined();
}

//startDevice(deviceId)
NAN_METHOD(StartDevice) {
  NanScope();

  const NanUtf8String *deviceIdStr = new NanUtf8String(args[0]);
  std::string deviceId(**deviceIdStr);

  const Device* device = deviceManager->getDevice(deviceId);
  if (device) {
    device->StartDevice();
  }
  NanReturnUndefined();
}

static Handle<Object> deviceData;
static bool theresBufferToSend = false;

Handle<Array> getSamplesArray(const std::vector<const Sample*> samples) {
  Local<Array> array = NanNew<Array>(samples.size());
  for (unsigned i = 0; i < samples.size(); i++) {
    Local<Object> obj = NanNew<Object>();
    obj->Set(NanNew<String>("size"), NanNew<Number>(samples[i]->size));
    obj->Set(NanNew<String>("compositionTimeOffset"), NanNew<Number>(samples[i]->timeDelta));
    array->Set(i, obj);
  }
  return array;
}

Handle<Object> getMetadataObject(const Metadata** metadata, const size_t metaLength) {
  Local<Object> obj = NanNew<Object>();

  for (unsigned i = 0; i < metaLength; i++) {
    const Metadata *meta = metadata[i];
    const Metadata::MetadataValue& value = meta->value;
    EMetadataKey key = meta->key;

    switch (key) {
    case EMetadataSPS:
    case EMetadataPPS:
      obj->Set(NanNew<String>(key == EMetadataSPS ? "sps" : "pps"), NanNewBufferHandle((char*)value.p, meta->size));
      break;
    case EMetadataSamples:
      obj->Set(NanNew<String>("samples"), getSamplesArray(value.arr));
      break;
    case EMetadataTimescale:
      obj->Set(NanNew<String>("timeScale"), NanNew<Number>(value.l));
      break;
    case EMetadataBaseTimeOffset:
      obj->Set(NanNew<String>("pts"), NanNew<Number>(value.ll));
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

    deviceData = NanNew<Object>();
    deviceData->Set(NanNew<String>("data"), NanNewBufferHandle((char*)data, length));
    deviceData->Set(NanNew<String>("metadata"), getMetadataObject(metadata, metaLength));
    theresBufferToSend = true;
  }
}

//fetchDevice()
NAN_METHOD(FetchDevice) {
  NanScope();

  const NanUtf8String *deviceIdStr = new NanUtf8String(args[0]);
  std::string deviceId(**deviceIdStr);

  const Device* device = deviceManager->getDevice(deviceId);
  if (!device) {
    NanReturnUndefined();
  } else {
    device->FetchDevice(onData);
    if (theresBufferToSend) {
      theresBufferToSend = false;
      NanReturnValue(deviceData);
    } else {
      NanReturnUndefined();
    }
  }
}

//stopDevice(deviceId)
NAN_METHOD(StopDevice) {
  NanScope();
  NanReturnUndefined();
}

//pauseDevice(deviceId)
NAN_METHOD(PauseDevice) {
  NanScope();
  NanReturnUndefined();
}

//resumeDevice(deviceId)
NAN_METHOD(ResumeDevice) {
  NanScope();
  NanReturnUndefined();
}

//configureDevice(deviceId, settings)
NAN_METHOD(ConfigureDevice) {
  NanScope();
  NanReturnUndefined();
}

//takeSnapshot(deviceId)
NAN_METHOD(TakeSnapshot) {
  NanScope();

  const NanUtf8String *deviceIdStr = new NanUtf8String(args[0]);
  std::string deviceId(**deviceIdStr);

  const Device* device = deviceManager->getDevice(deviceId);
  if (device) {
    device->TakeSnapshot();
  }
  NanReturnUndefined();
}

//getZeroInformationContent(deviceId)
NAN_METHOD(GetZeroInformationContent) {
  NanScope();
  NanReturnUndefined();
}

void Init(Handle<Object> exports) {
  exports->Set(NanNew<String>("getSupportedCodecs"),
			      NanNew<FunctionTemplate>(GetSupportedCodecs)->GetFunction());
  exports->Set(NanNew<String>("getSupportedConstraints"),
			      NanNew<FunctionTemplate>(GetSupportedConstraints)->GetFunction());
  exports->Set(NanNew<String>("getAvailableDeviceInfo"),
			      NanNew<FunctionTemplate>(GetAvailableDeviceInfo)->GetFunction());
  exports->Set(NanNew<String>("initDevice"),
			      NanNew<FunctionTemplate>(InitDevice)->GetFunction());
  exports->Set(NanNew<String>("startDevice"),
			      NanNew<FunctionTemplate>(StartDevice)->GetFunction());
  exports->Set(NanNew<String>("fetchDevice"),
			      NanNew<FunctionTemplate>(FetchDevice)->GetFunction());
  exports->Set(NanNew<String>("stopDevice"),
			      NanNew<FunctionTemplate>(StopDevice)->GetFunction());
  exports->Set(NanNew<String>("pauseDevice"),
			      NanNew<FunctionTemplate>(PauseDevice)->GetFunction());
  exports->Set(NanNew<String>("resumeDevice"),
			      NanNew<FunctionTemplate>(ResumeDevice)->GetFunction());
  exports->Set(NanNew<String>("configureDevice"),
			      NanNew<FunctionTemplate>(ConfigureDevice)->GetFunction());
  exports->Set(NanNew<String>("takeSnapshot"),
			      NanNew<FunctionTemplate>(TakeSnapshot)->GetFunction());
  exports->Set(NanNew<String>("getZeroInformationContent"),
			      NanNew<FunctionTemplate>(GetZeroInformationContent)->GetFunction());
}

NODE_MODULE(addon, Init)
