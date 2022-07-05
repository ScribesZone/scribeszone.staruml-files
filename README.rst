staruml-files
=============

This extension allows to "attach" files to model element.
The file can then be opened from StarUML.


In practice the extension add two items in the contextual menu:

*   ```Attach file```. This allows to add a file to the selected element.
    A dialog is used to select an existing file.
    In practice this command will tag the element with a tag ```file```.
    The value of the tag is the filename.

*   ```Open file```. This command opens the file attached to the
    selected element if any. The "processor" used to open the file can
    be configured in the configuration file : ```config/config.json```.
    See this file for more information. You should adapt the content of
    this file according to your platform, system settings, installed
    software, etc.

**NOTE 1**: Nothing is hidden : the tag "file" can be created manually and the
value of these tags can be set in the property box of StarUML. The
```Attach file``` command is just a convenient way to ensure that filenames
correspond to actual files.

**NOTE 2**: This is a very first version of this tool. Error handling is
very poor. In case of problem it could be useful to have a look at the
console using ```Debug > Show DevTools```.
