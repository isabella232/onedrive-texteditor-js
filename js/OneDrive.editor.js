var markdownEditor = {
    // The item.id value for the currently open file.
    openFileID: "",
    baseUrl: "https://api.onedrive.com/v1.0",
    accessToken: "",
    openFileName: "",

    // Clear the current editor buffer and reset any local state so we don't
    // overwrite an existing file by mistake.
    createNewFile: function () {
        this.openFileID = "";
        this.setFilename("text-file1.txt");
        $("#canvas").val("");
    },

    // Open a new file by invoking the picker to select a file from OneDrive.
    openFile: function () {
        var parent = this;
        var options = {
            success: function (files) {
                var selectedFile = files.value[0];
                parent.openItemInEditor(selectedFile);

                parent.baseUrl = files.baseUrl;
                parent.accessToken = files.accessToken;
            },
            cancel: function () { },
            linkType: "downloadLink",
            multiSelect: false
        };
        OneDrive.open(options);
    },

    // Save the contents of the editor back to the file that was opened. If no file was
    // currently open, the saveAsFile method is invoked.
    saveFile: function () {
        if (this.openFileID == "") {
            this.saveAsFile();
            return;
        }

        // Craft a REST API request to upload to the existing resource ID
        var postUrl = this.baseUrl + "drive/items/" + this.openFileID + "/content";

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                window.alert("Saved successfully!");
            }
        }
        xhr.onerror = function() {
            window.alert("Error occured saving file.");
        }

        xhr.open("PUT", postUrl, true);
        xhr.setRequestHeader("Content-type", "application/octet-stream");
        xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken)

        var bodyContent = $("#canvas").val();
        var bodyContentLineBreaks = bodyContent.replace(/\r\n|\r|\n/g, "\r\n");
        xhr.send(bodyContentLineBreaks);
    },

    // Save the contents of the editor back to the server using a new filename. Invokes
    // the picker to allow the user to select a folder where the file should be saved.
    saveAsFile: function () {
        var filename = this.openFileName;
        if (filename == "") filename = "textfile1.txt";

        var dataUri = this.encodeTextAsDataUrl($("#canvas").val());
        var options = {
            file: dataUri,
            fileName: filename,
            success: function () {
                window.alert("save successful!");
            },
            error: function (e) {
                window.alert("An error occured while saving the file: " + e);
            }
        };

        OneDrive.save(options);
    },

    // Rename the currently open file by providing a new name for the file via an input
    // dialog
    renameFile: function () {
        var newFilename = window.prompt("New filename", "");
        if (newFilename)
        {
            this.setFilename(newFilename);
        }
    },

    // Method used to open the picked file into the editor. Resets local state
    // and downloads the file from OneDrive.
    openItemInEditor: function (fileItem) { 
        var downloadLink = fileItem["@content.downloadUrl"];
        this.downloadUrlIntoEditor(downloadLink);

        this.setFilename(fileItem.name);
        this.openFileID = fileItem.id;
        
    },

    setFilename: function (filename) {
        var btnRename = this.buttons["rename"];
        if (btnRename) {
            $(btnRename).text(filename);
        }
        this.openFileName = filename;
    },

    // Download a URL from OneDrive and load the file as text into the editor.
    downloadUrlIntoEditor: function (url) {
        var xhr = new XMLHttpRequest();
        var parent = this;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                parent.setEditorBody(xhr.responseText);
            }
        }
        xhr.open("GET", url, true);
        xhr.send(null);
    },

    // Set the contents of the editor to a new value.
    setEditorBody: function (text) {
        $("#canvas").val(text);
    },

    encodeTextAsDataUrl: function (text) {
        return "data:text/plain;base64," + Base64.encode(text);
    },

    buttons: {},
    wireUpCommandButton: function(element, cmd)
    {
        this.buttons[cmd] = element;
        if (cmd == "new") {
            element.onclick = function () { markdownEditor.createNewFile(); return false; }
        }
        else if (cmd == "open") {
            element.onclick = function () { markdownEditor.openFile(); return false; }
        }
        else if (cmd == "save") {
            element.onclick = function () { markdownEditor.saveFile(); return false; }
        }
        else if (cmd == "saveAs") {
            element.onclick = function () { markdownEditor.saveAsFile(); return false; }
        }
        else if (cmd == "rename") {
            element.onclick = function () { markdownEditor.renameFile(); return false; }
        }
    }
}

var Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9\+\/\=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r) } if (a != 64) { t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function (e) { e = e.replace(/\r\n/g, "\n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function (e) { var t = ""; var n = 0; var r = c1 = c2 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } };




