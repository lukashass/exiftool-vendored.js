import * as bc from "batch-cluster"
import { geoTz } from "./GeoTz"
import { IgnorableError } from "./IgnorableError"

export interface ExifToolOptions
  extends bc.BatchClusterOptions,
    bc.BatchProcessOptions,
    bc.ChildProcessFactory {
  /**
   * The maximum number of ExifTool child processes to spawn when load merits.
   *
   * Defaults to 1/4 the number of CPUs, minimally 1.
   */
  maxProcs: number

  /**
   * The maximum number of requests a given ExifTool process will service before
   * being retired.
   *
   * Defaults to 500, to balance performance with memory usage.
   */
  maxTasksPerProcess: number

  /**
   * Spawning new ExifTool processes must not take longer than
   * `spawnTimeoutMillis` millis before it times out and a new attempt is made.
   * Be pessimistic here--windows can regularly take several seconds to spin up
   * a process, thanks to antivirus shenanigans. This can't be set to a value
   * less than 100ms.
   *
   * Defaults to 30 seconds, to accommodate slow Windows machines.
   */
  spawnTimeoutMillis: number

  /**
   * If requests to ExifTool take longer than this,
   * presume the underlying process is dead and we should restart the task. This
   * can't be set to a value less than 10ms, and really should be set to at more
   * than a second unless `taskRetries` is sufficiently large or all writes will
   * be to a fast local disk. Defaults to 10 seconds.
   */
  taskTimeoutMillis: number

  /**
   * An interval timer is scheduled to do periodic maintenance of underlying
   * child processes with this periodicity.
   *
   * Defaults to 2 seconds.
   */
  onIdleIntervalMillis: number

  /**
   * The number of times a task can error or timeout and be retried.
   *
   * Defaults to 1 (every task gets 2 chances).
   */
  taskRetries: number

  /**
   * Allows for non-standard paths to ExifTool. Defaults to the perl or windows
   * binaries provided by `exiftool-vendored.pl` or `exiftool-vendored.exe`.
   */
  exiftoolPath: string

  /**
   * Args passed to exiftool on launch.
   */
  exiftoolArgs: string[]

  /**
   * Environment variables passed to ExifTool (besides `EXIFTOOL_HOME`)
   */
  exiftoolEnv: NodeJS.ProcessEnv

  /**
   * Should ExifTool use MWG (Metadata Working Group) composite tags for
   * reading and writing tags?
   *
   * ExifTool recommends this to be set to true.
   *
   * Note that this can result in many tag value differences from
   * `ExifTool.read`, and makes `ExifTool.write` write to "synonymous" MWG
   * tags automatically.
   *
   * @see https://exiftool.org/TagNames/MWG.html for details
   */
  useMWG: boolean

  /**
   * Tag names (which can have '*' glob matchers) which you want numeric
   * values, rather than ExifTool's "Print Conversion."
   *
   * If you're using tag values only for human consumption, you may want to
   * leave this blank.
   *
   * The default includes "*Duration*", "GPSAltitude", "GPSLatitude",
   * "GPSLongitude", "GPSPosition", and "Orientation".
   */
  numericTags: string[]

  /**
   * If set to true, ExifTool will attempt to calculate an "ImageDataMD5" tag
   * value with the MD5 checksum of image data.
   *
   * Note that as of 2022-04-12, ExifTool supports JPEG, PNG, and many raw
   * image formats, like CR2 and NEF. It doesn't yet support HEIC/HEIF, ORF,
   * GIF, and many video formats, like MP4 and MTS.
   *
   * This defaults to false, as it adds ~20ms of overhead to every read
   */
  includeImageDataMD5: boolean

  /**
   * Video file dates are assumed to be in UTC, rather than using timezone
   * inference used in images. To disable this default, set this to false.
   *
   * @see https://github.com/photostructure/exiftool-vendored.js/issues/113
   */
  defaultVideosToUTC: boolean

  /**
   * Should we try to backfill timezones for date-times that don't have them?
   * If set to `true`, and `defaultVideosToUTC` is also `true`, we'll try
   * backfilling timezones for date-times that are UTC, as well.
   *
   * This defaults to false to retain prior versions' behavior.
   */
  backfillTimezones: boolean

  /**
   * We always look at TimeZone, OffsetTime, TimeZoneOffset, and GPS metadata
   * to infer the timezone.
   *
   * If these strategies fail, can we infer a timezone from any non-UTC
   * datestamp whose tag starts with "Creat" and includes an offset? (This
   * means CreateDateSubSec, CreateDate, and CreationDate will be considered).
   *
   * This defaults to false to retain prior versions' behavior.
   */
  inferTimezoneFromDatestamps: boolean

  /**
   * `ExifTool` has a shebang line that assumes a valid `perl` is installed at
   * `/usr/bin/perl`.
   *
   * Some environments may not include a valid `/usr/bin/perl` (like AWS
   * Lambda), but `perl` may be available in your `PATH` some place else (like
   * `/opt/bin/perl`), if you pull in a perl layer.
   *
   * This will default to `true` in those environments as a workaround in these
   * situations. Note also that `perl` will be spawned in a sub-shell.
   */
  ignoreShebang: boolean

  /**
   * Should we check for a readable and executable `perl` file in $PATH? This
   * defaults to false on Windows, and true everywhere else. Set this to false
   * if you know perl is installed.
   */
  checkPerl: boolean

  /**
   * Override the default geo-to-timezone lookup service.
   *
   * This defaults to `@photostructure/tz-lookup`, but if you have the
   * resources, consider using `geo-tz` for more accurate results.
   *
   * Here's a snippet of how to use `geo-tz` instead of `tz-lookup`:
   *
```js
const geotz = require("geo-tz")
const { ExifTool } = require("exiftool-vendored")
const exiftool = new ExifTool({ geoTz: (lat, lon) => geotz.find(lat, lon)[0] })
```
   *
   * @see https://github.com/photostructure/tz-lookup
   * @see https://github.com/evansiroky/node-geo-tz/
   */
  geoTz: typeof geoTz

  /**
   * Predicate for error handling.
   *
   * ExifTool will emit error and warning messages for a variety of reasons.
   *
   * The default implementation ignores all errors that begin with "Warning:"
   *
   * @return true if the error should be ignored
   */
  isIgnorableError: IgnorableError
}
