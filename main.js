
/*global $, app, type*/

const fs = require('fs')
const path = require('path')
const child_process = require("child_process");

const configuration_filename = path.join(__dirname, 'config', 'config.json')

// const use_command = '/home/favreje/SOFTWARE/use-5.1.0/bin/use  {{filename}}'
// const code_command = 'code {{filename}}'
// const xdg_command = 'xdg-open file:///{{filename}}'

// app.platform

var configuration

function log(message) {
    console.log('[files]: '+ message)
}

function readConfigurationFile() {
    if (configuration === undefined
            || configuration['reload'] === "true") {
        try {
            let text = fs.readFileSync(configuration_filename)
            configuration = JSON.parse(text)
            log('config: configuration file read')
        } catch (error) {
            app.error('Error while reading configuration file config/config.json')
            log('config: cannot read configuration file')
            log(error)
        }
    } else {
        log('config: configuration file not read again')
    }
}

/**
 *
 */
function matchProcessorPattern(filename, pattern) {
    // deal with extension field
    const extension_json = pattern["extension"]
    var extensions
    if (extension_json === undefined) {
        extensions = undefined
    } else if (typeof extension_json === 'string') {
        extensions = [extension_json]
    } else {
        extensions = extension_json
    }
    if (extensions === undefined) {
        log(filename+'match: filename match no extension specified')
        return true
    } else {
        const matching = extensions.includes(path.extname(filename))
        log('match: '+filename+' '
            +(matching?'match':"does not match ")
            +' '+matching)
        return matching
    }
}


function getMatchingProcessorPattern(filename) {
    readConfigurationFile()
    for (const pattern of configuration["processors"]) {
        if (matchProcessorPattern(filename, pattern)) {
            return pattern
        }
    }
    // log('')
    return undefined
}

function getCommandLine(filename) {
    const pattern = getMatchingProcessorPattern(filename)
    if (pattern === undefined) {
        return undefined
    } else {
        return pattern['command'].replace('{{filename}}',filename)
    }
}

function execute(command) {
    child_process.exec(command,
        (error, stdout, stderr) => {
        if (error) {
            log(`exec: error: ${error.message}`);
            return;
        }
        if (stderr) {
            log(`exec: stderr: ${stderr}`);
            return;
        }
        log(`exec: stdout: ${stdout}`);
        return stdout
    });
}

function isFileTag(tag) {
    return tag.name.match(/^file|.*\(file\)$/)
}

function fileTagsForElement(element) {
    if (element instanceof type.Tag) {
        // this is a tag, returns it if it is a tag file
        if (isFileTag(element)) {
            return [element]
        } else {
            return []
        }
    } else {
        // return the "file" tag if any, otherwise return the first
        // file tag
        const file_tag = element.getTag('file')
        if (file_tag) {
            return [file_tag]
        } else {
            return (
                element.tags.filter(
                    tag => isFileTag(tag)))
        }
    }
}

function getAbsoluteFileName(fileTag) {
    console.assert(isFileTag)
    const filepath = fileTag.value
    if (path.isAbsolute(filepath)) {
        return filepath
    } else {
        const project_directory = path.dirname(app.project.filename)
        return path.join(project_directory, filepath)
    }
}

function getFilenameFromSelection() {
    let error_msg
    const selected_elements = app.selections.getSelectedModels()
    if (selected_elements.length === 1) {
        const file_tags = fileTagsForElement(selected_elements[0])
        if (file_tags.length >= 1) {
            const first_file_tag = file_tags[0]
            const filename = getAbsoluteFileName(first_file_tag)
            if (filename) {
                log(`filename: "${filename}"`)
                return filename
            } else {
                error_msg = "Tag file has no value. Should be a filename."
            }
        } else {
            error_msg = "No file tag found in the selected element."
        }
    } else {
        error_msg = "Please selected one element."
    }
    app.toast.error(error_msg, 20)
    log('filename: ')
    return null
}




function _handleOpen() {
    const filename = getFilenameFromSelection()
    if (filename) {
        log('file = ' + filename)
        const command = getCommandLine(filename)
        if (command !== undefined) {
            log(command)
            app.toast.info("Opening " + command)
            execute(command)
            app.toast.info("Command executed")
        } else {
            const msg = "No processor available for " + filename
            app.toast.error(msg)
            log(msg)
        }
    } else {
        const msg = 'No file to open'
        app.toast.error(msg)
        log(msg)
    }
}

//-------------------------------------------------------------------------


function createTag(element, name, value) {
    var options = {
        id: "Tag",
        parent: element,
        field: "tags",
        modelInitializer: function (tag) {
            tag.name = name
            tag.kind = type.Tag.TK_STRING
            tag.value = value
        }
    }
    return app.factory.createModel(options)
}

/*
Ensure that there is a tag file under the element with value=filename.
If the tag file already exist change the value.
Otherwise create a brand new tag file.
Select the element at the end. This is necessary since the tag creation
could have changed the selection.
 */
function ensureFileTagValue(element, filename) {
    let tag = element.getTag('file')
    if (tag === undefined) {
        tag = createTag(element, 'file', filename)
    }
    app.engine.setProperty(tag, 'value',  filename)
    app.modelExplorer.select(element, true)
}

function _handleAttach() {
    const selected_element = app.selections.getSelectedModels()[0]
    if (selected_element) {
        // const selected_element = selected_elements[0]
        // ask for a file
        const files=app.dialogs.showOpenDialog('Select attachement')
        if (files) {
            filename = files[0]
            ensureFileTagValue(selected_element, filename)
            app.toast.info('File attached successfully')
        } else {
            // User cancel the attachement operation.
            // Do not remove the file tag.
        }
    } else {
        app.toast.warning('No element selected', 5)
    }
}


//------------------------------------------------------------------------
// Initilisation
//------------------------------------------------------------------------

function init() {
    readConfigurationFile()
    app.commands.register('files:attach', _handleAttach)
    app.commands.register('files:open', _handleOpen)
}

exports.init = init

/**/