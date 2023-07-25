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

    disableLogger() {
        this.enabled = false;
    }

    enableLogger() {
        this.enabled = true;
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

    baseLog(logType, logName, logStr, logSub, style) {
        if (this.enabled) {
            if (logSub === null) {
                window.console[`${logType}`](`%c${this.appName} [%c${logName}%c]:%c ${logStr}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors[`${logName}`]}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors.str}`,
                                             ...(style ?? [])
                                            );
            } else {
                window.console[`${logType}`](`%c${this.appName}(%c${logSub}%c) [%c${logName}%c]:%c ${logStr}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors.sub}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors[`${logName}`]}`,
                                             `color: ${this.colors.main}`,
                                             `color: ${this.colors.str}`,
                                             ...(style ?? [])
                                            );
            }
        }
    }

    info(str, subScriptName = null) {
        this.baseLog('info', 'info', str, subScriptName)
    }

    error(str, subScriptName = null) {
        this.baseLog('error', 'error', str, subScriptName)
    }

    run(str, subScriptName = null) {
        this.baseLog('info', 'run', str, subScriptName)
    }

    withStyle(str, subScriptName = null, style) {
        if (Array.isArray(subScriptName)) {
            style = subScriptName;
            subScriptName = null;
        }
        this.baseLog('info', 'info', str, subScriptName, style)
    }

    raw(type, obj) {
        if (this.enabled) {
            window.console.log(`%c${this.appName} [%cRAW%c]`, `color: ${this.colors.main}`, `color: ${this.colors.raw}`, `color: ${this.colors.main}`);
            window.console[`${type}`](obj);
        }
    }
}
