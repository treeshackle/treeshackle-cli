# Treeshackle

Keep tabs on the size of exports and the tree shake-ability of your library.

## Installation

To install Treeshackle, run the following in your terminal

```
$ npm i -S treeshackle
```

Then run `treeshackle --help` for information on the commands it provides.

## Usage

```bash
$ treeshackle # In root of library (where your package.json file lives)
```

**NOTE**: be sure to compile your library for distribution first. Treeshackle
needs your actual library distributables so it pretend it is a consumer of your
library.

### `--write, -w`

Write out the report to a `treeshackle-lock.yaml` file. This should be commited
to your version control.

### `--ci, -c`

Generate the report and diff against an existing `treeshackle-lock.yaml`
file. If any differences are found between the new report and the lock file,
then the process will exit with error code 1, and output the differences in
the reports.

Perfect for running in your CI if you want to keep an eye on the sizes of
your exports when tree-shaken.
