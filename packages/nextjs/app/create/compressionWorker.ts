import LZ from "lz-string";

self.onmessage = function (event) {
  const { data } = event;
  const compressedData = LZ.compress(data);
  self.postMessage(compressedData);
};
