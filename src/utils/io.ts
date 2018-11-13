const STD_OUT_STREAM = process.stdout.write;
const STD_ERR_STREAM = process.stderr.write;
const STD_IO_STUB = (_buffer: any, _callback: any) => true;

export function disableStdio() {
  process.stdout.write = STD_IO_STUB;
  process.stderr.write = STD_IO_STUB;
}

export function enableStdio() {
  process.stdout.write = STD_OUT_STREAM;
  process.stderr.write = STD_ERR_STREAM;
}
