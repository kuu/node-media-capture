#ifndef H264_ENCODER_H
#define H264_ENCODER_H

enum ENALUnitType {
  ENALUnitSPS,
  ENALUnitPPS,
  ENALUnitSlice
};

static const size_t DEFAULT_SAMPLE_COUNT = 40;

class H264Encoder {
public:
  H264Encoder(void *client, int intputFrameW, int inputFrameH, int outputFrameW, int outputFrameH, int fps, int bitrate, bool useBaseline = true, int ctsOffset = 0);
  ~H264Encoder();

  CVPixelBufferPoolRef pixelBufferPool();

  // Input is expecting a CVPixelBufferRef
  void pushBuffer(const uint8_t* const data, size_t size, int64_t timestamp, int32_t timescale, bool forceKeyFrame);
  //void setOutput(std::shared_ptr<IOutput> output) { m_output = output; };

  void setBitrate(int bitrate) ;
  int bitrate() const { return m_bitrate; };
  void requestKeyframe();
  void compressionSessionOutput(const ENALUnitType type, const uint8_t* data, size_t size, uint64_t pts, uint32_t timescale);
  void flush();
        
private:
  void setupCompressionSession(bool useBaseline);
  void teardownCompressionSession();
  void addEntry(const uint8_t *data, size_t size, int64_t timeDelta);
  void flushCompressedData();

  //std::weak_ptr<IOutput> m_output;
  void*                  m_client;
  void*                  m_compressionSession;
  int                    m_inputFrameW;
  int                    m_inputFrameH;
  int                    m_outputFrameW;
  int                    m_outputFrameH;
  int                    m_fps;
  int                    m_bitrate;
  int                    m_ctsOffset;
  bool                   m_baseline;
  bool                   m_flush;
  const uint8_t *spsData;
  size_t spsDataLen;
  const uint8_t *ppsData;
  size_t ppsDataLen;
  const uint8_t **samples;
  size_t sampleByteLength;
  size_t *sampleSizeList;
  int32_t *sampleTimeList;
  size_t sampleCount;
  size_t maxSampleCount;
  int32_t m_timescale;
  int64_t m_baseTimeOffset;
  int64_t m_firstBaseTimeOffset;
};

#endif // H264_ENCODER_H
