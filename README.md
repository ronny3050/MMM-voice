## Warning this is still work in progress

# MMM-voice
Voice Recognition Module for MagicMirror<sup>2</sup>

## Dependencies
  * An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)
  * [SphinxBase](http://cmusphinx.sourceforge.net/)
  * [pocketsphinx](https://github.com/cmusphinx/pocketsphinx)
  * The pocketsphinx_continuous binary on your path.
  * A microphone
  * npm
  * [pocketsphinx-continuous](https://www.npmjs.com/package/pocketsphinx-continuous)

## Installation
 1. Clone this repo into `~/MagicMirror/modules` directory.
 2. Configure your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-voice',
        position: 'bottom_bar',
        config: {
            id: 'base'
            ...
        }
    }
    ```
 3. Run command `npm install` in `~/MagicMirror/modules/MMM-voice` directory.
 4. Edit `~/MagicMirror/modules/MMM-voice/node_modules/pocketsphinx-continuous/index.js` to:

    ```
    function PocketSphinxContinuous(config) {
      ...

      var pc = spawn('pocketsphinx_continuous', [
        '-adcdev',
        'plughw:0',
        '-inmic',
        'yes',
        '-lm',
        'modules/MMM-voice/' + this.setId + '.lm',
        '-dict',
        'modules/MMM-voice/' + this.setId + '.dic'
      ]);
      ...
    ```

## Config Options
| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `timeout` | 15 | time the keyword should be active without saying something |
| `id` | REQUIRED | id of dictionairy file |

## Installer
Run <code>cd installer</code> and <code>bash pocketsphinx_install.sh</code>. This should install all the required external tools.

## Adding Voice Command in your own module
For adding voice commands in your module, first declare a mode adding <code>this.sendNotification('REGISTER_VOICE_MODULE',{ mode: "MODE_NAME"}, this);</code>
Then, add a file called 'commands.json' in your module directory with the following pattern:

    ```
    {
        "command_name": "COMMAND_LIST"
    }
    ```
  For instance, if I were to add the voice command "COUNT UNREAD" to my email module, I would add the following commands.json file:

    ```
    {
        "count": "COUNT UNREAD"
    }
    ```
