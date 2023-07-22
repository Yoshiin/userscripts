// ==UserScript==
// @name         uLog
// @namespace    https://github.com/Yoshiin/uLog
// @version      1.0
// @description  uLog.js
// @author       Yoshin <l.mora@outlook.fr> (https://github.com/Yoshiin/)
// ==/UserScript==
/*
* uLog.js
* v1.0.0
*/
class Logger {
    constructor(appName, mainColor = '#FFFFFF') {
        this.appName = appName;
        this.enabled = true;
        this.colors = {
            main: mainColor,
            sub: '#9AA0A6',
            info: '#F2AB26',
            error: '#FF8080',
            run: '#356EB9',
            raw: '#E01473',
            str: '#FFFFFF',
        };
    }

    configColors(configObj) {
        let newColorsConfig = this.colors;
        Object.keys(configObj).forEach(key => {
            if (key in newColorsConfig) {
                newColorsConfig[key] = configObj[key];
            }
        });
        this.colors = newColorsConfig;
    }

    baseLog(logType, logName, logStr, logSub, ...style) {
        if (this.enabled) {
            if (!logSub) {
                window.console[`${logType}`](`%c${this.appName}[%c${logName}%c]:%c ${logStr}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors[`${logName}`]}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors.str}`,
                                             ...style
                                            );
            } else {
                window.console[`${logType}`](`%c${this.appName}(%c${logSub}%c)[%c${logName}%c]:%c ${logStr}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors.sub}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors[`${logName}`]}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors.str}`,
                                             ...style
                                            );
            }
        }
    }

    info(str, subScriptName = undefined) {
        this.baseLog('info', 'info', str, subScriptName)
    }

    error(str, subScriptName = undefined) {
        this.baseLog('error', 'error', str, subScriptName)
    }

    run(str, subScriptName = undefined) {
        this.baseLog('info', 'run', str, subScriptName)
    }

    withStyle(str, subScriptName = undefined, ...style) {
        this.baseLog('info', 'info', str, subScriptName, ...style)
    }

    raw(type, obj) {
        if (this.enabled) {
            window.console.log(`%c${this.appName} [%cRAW%c]`, `color: ${this.colors.main}`, `color: ${this.colors.raw}`, `color: ${this.colors.main}`);
            window.console[`${type}`](obj);
        }
    }

    /*
    static elmOp(type, name, desc) {
        if (this.enabled) {
            switch (type) {
                case 'new':
                    window.console.info(`%cETT(%cELM%c) [%cinfo%c]:%c New card found for %c${name}%c: title set to "%c${desc}%c"`,
                                 'color: #BF94FF', 'color: #9AA0A6', 'color: #BF94FF', 'color: #F2AB26', 'color: #BF94FF', 'color: #FFFFFF', 'font-weight: bolder', 'font-weight: normal', 'font-style: italic', 'font-style: normal');
                    break;
                case 'update':
                    window.console.info(`%cETT(%cELM%c) [%cinfo%c]:%c Update card for %c${name}%c: title updated to "%c${desc}%c"`,
                                 'color: #BF94FF', 'color: #9AA0A6', 'color: #BF94FF', 'color: #F2AB26', 'color: #BF94FF', 'color: #FFFFFF', 'font-weight: bolder', 'font-weight: normal', 'font-style: italic', 'font-style: normal;');
                    break;
                case 'noupdate':
                default:
                    window.console.info(`%cETT(%cELM%c) [%cinfo%c]:%c Update card for %c${name}%c: noting to do`,
                                 'color: #BF94FF', 'color: #9AA0A6', 'color: #BF94FF', 'color: #F2AB26', 'color: #BF94FF', 'color: #FFFFFF', 'font-weight: bolder', 'font-weight: normal');
            }
        }
    }
    */
}
