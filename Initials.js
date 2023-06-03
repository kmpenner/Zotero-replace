// see https://www.zotero.org/support/dev/client_coding/javascript_api#batch_editing
// From Dan Stillman at https://forums.zotero.org/discussion/80506/
// first make a backup of zotero.sqlite in your Zotero data directory with Zotero closed and then go to Tools → Developer → Run JavaScript
// combined with code from https://forums.zotero.org/discussion/7707/find-and-replace-on-multiple-items/p2
// by tanaree https://forums.zotero.org/profile/1648161/tanaree April 17, 2014

// For creators, sample JSON is [{"fieldMode":0,"firstName":"Israel","lastName":"Knohl","creatorTypeID":1}]
// so the regExFil should include the colon and double quotes like /"firstName":"Ken(neth)?"/gm
// and the replaceText should be in single quotes and double quotes like '"firstName":"Ken M."'

let creator = prompt("Enter creator name:");
//alert(creator.length);
while (creator.length > 0) {
    //alert (creator);
    let creatorNames = creator.split(", ");
    let creatorSearch = "(\"firstName\":\")(" + creatorNames[1].slice(0, 1) + "(?:" + creatorNames[1].slice(1,) + ")?[-A-Z a-z.]*)(\",\"lastName\":\"" + creatorNames[0] + "\")";
    //alert(creatorSearch);
    fieldDataList = [
        {
            "name": creatorNames[0],
            "fieldName": "creator",
            "regExFilt": RegExp(creatorSearch, "gm"),
            "replaceText": "$1" + creatorNames[1] + "$3"
        }
    ];
    var totalChanges = 0;
    //    alert(fieldDataList);
    for (const fieldData of fieldDataList) {
        var changes = 0;
        var oldValue = "";
        var fieldID = Zotero.ItemFields.getID(fieldData.fieldName);
        var items = Zotero.getActiveZoteroPane().getSelectedItems();

        await Zotero.DB.executeTransaction(async function () {
            for (let item of items) {
                //alert(fieldData.regExFilt);
                switch (fieldData.fieldName) {
                    case "creator":
                        oldValue = JSON.stringify(item.getCreators());
                        break;
                    default:
                        oldValue = item.getField(fieldData.fieldName);
                }
                //                var regex = new RegExp(fieldData.findText);
                //alert(fieldDataList);
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

        //    alert(changes + " item(s) modified for : " + fieldData.name);
        totalChanges += changes;
    }
    creator = prompt(changes + " item(s) modified. Enter next creator name (or blank if done):");
}
return totalChanges + " item(s) modified in total";
