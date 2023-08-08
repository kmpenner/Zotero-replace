// initials.js
// Input: tab-separated file specified by "path" with names
// Replaces creators with that last name and matching first initial with the given name specified in the input file.

// see https://www.zotero.org/support/dev/client_coding/javascript_api#batch_editing
// From Dan Stillman at https://forums.zotero.org/discussion/80506/
// first make a backup of zotero.sqlite in your Zotero data directory with Zotero closed and then go to Tools → Developer → Run JavaScript
// combined with code from https://forums.zotero.org/discussion/7707/find-and-replace-on-multiple-items/p2
// by tanaree https://forums.zotero.org/profile/1648161/tanaree April 17, 2014

/*
 function getName() {

    return (prompt(changes + " item(s) modified. Enter next creator name (or blank if done):"));
}
*/
var path = '/Users/kmpen/OneDrive/Desktop/Names.txt';

var data = await Zotero.File.getContentsAsync(path);
let namesList = data.split("\r\n");
let nameIndex = 0;
function getName() {
    return (namesList[nameIndex++]);
}

let creator = getName();
while (creator.length > 0) {
    let creatorNames = creator.split("\t");
    let creatorSearch = "(\"firstName\":\")(" + creatorNames[1].slice(0, 1) + "(?:" + creatorNames[1].slice(1,) + ")?[-A-Z a-z.]*)(\",\"lastName\":\"" + creatorNames[0] + "\")";
    fieldDataList = [
        {
            "name": creatorNames[0],
            "fieldName": "creator",
            "regExFilt": RegExp(creatorSearch, "gm"),
            "replaceText": "$1" + creatorNames[1] + "$3"
        }
    ];
    var totalChanges = 0;
    for (const fieldData of fieldDataList) {
        var changes = 0;
        var oldValue = "";
        var fieldID = Zotero.ItemFields.getID(fieldData.fieldName);
        var items = Zotero.getActiveZoteroPane().getSelectedItems();

        await Zotero.DB.executeTransaction(async function () {
            for (let item of items) {
                switch (fieldData.fieldName) {
                    case "creator":
                        oldValue = JSON.stringify(item.getCreators());
                        break;
                    default:
                        oldValue = item.getField(fieldData.fieldName);
                }
                //                var regex = new RegExp(fieldData.findText);
                newValue = oldValue.replace(fieldData.regExFilt, fieldData.replaceText);
                if (newValue != oldValue) {
                    changes++;
                    switch (fieldData.fieldName) {
                        case "creator":
                            item.setCreators(JSON.parse(newValue));
                            break;
                        default:
                            let mappedFieldID = Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, fieldData.fieldName);
                            item.setField(mappedFieldID ? mappedFieldID : fieldID, newValue);
                    }
                    await item.save();
                }
            }
        });

        Zotero.log(changes + " item(s) modified for : " + fieldData.name);
        totalChanges += changes;
    }
    creator = getName();
}
return totalChanges + " item(s) modified in total";
