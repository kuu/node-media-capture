#ifndef BUILTIN_MICROPHONE_H
#define BUILTIN_MICROPHONE_H

#include "../../microphone.h"

class BuiltinMicrophone : public Microphone {
private:
  //struct Impl;
  //void *pImpl_;

public:
  static const std::vector<const Capability*>& getCapabilities();

  BuiltinMicrophone(
    const std::string deviceId,
    const EDeviceKind kind,
    const std::string label,
    const std::string groupId,
    const std::vector<const Capability*> capabilities
  );

  ~BuiltinMicrophone();

  std::vector<std::string>& GetSupportedCodecs() const;
  std::vector<EConstraints>& GetSupportedConstraints() const;
  void InitDevice(const std::vector<const Constraint *>& settings, const std::function<void (const bool)> &callback) const;
  void StartDevice() const;
  void TakeSnapshot() const;
  void FetchDevice(void (*callback)(const void * const, size_t, const Metadata**, const size_t)) const;
};

#endif // BUILTIN_MICROPHONE_H
