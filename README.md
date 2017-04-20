# OSR Demo

## Usage

```
Usage: index.js -o [output] -f [file]

Options:
  -o, --out   Where to writ the file to [string] [required] [default: "out.csv"]
  -f, --file  Load a file                                    [string] [required]
  -h, --help  Show help                                                [boolean]
```

## Example

```
$ node index.js -f input.png -o out.csv

======================================== 100% (initializing tesseract)
======================================== 100% (initializing tesseract)
======================================== 100% (loading eng.traineddata)
======================================== 100% (initializing api)
======================================== 100% (recognizing text)
Complete!
```
