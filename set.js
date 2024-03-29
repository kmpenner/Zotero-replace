// see https://www.zotero.org/support/dev/client_coding/javascript_api#batch_editing
// From Dan Stillman at https://forums.zotero.org/discussion/80506/
// first make a backup of zotero.sqlite in your Zotero data directory with Zotero closed and then go to Tools → Developer → Run JavaScript
// combined with code from https://forums.zotero.org/discussion/7707/find-and-replace-on-multiple-items/p2
// by tanaree https://forums.zotero.org/profile/1648161/tanaree April 17, 2014

// For creators, sample JSON is [{"fieldMode":0,"firstName":"Israel","lastName":"Knohl","creatorTypeID":1}]
// so the regExFil should include the colon and double quotes like /"firstName":"Ken(neth)?"/gm
// and the replaceText should be in single quotes and double quotes like '"firstName":"Ken M."'

var totalChanges = 0;
var f,c="";
fieldName=prompt("field name (or blank to cancel):");
if (fieldName.length>0) {
    var changes = 0;
    var oldValue = "";
    var fieldID = Zotero.ItemFields.getID(fieldName);
    var items = Zotero.getActiveZoteroPane().getSelectedItems();

    await Zotero.DB.executeTransaction(async function () {
    switch (fieldName) {
        case "creator":
            oldValue = JSON.stringify(items[0].getCreators());
            break;
        default:
            oldValue = items[0].getField(fieldName);
    }
    newValue=prompt("set "+fieldName+" to:",oldValue);
        for (let item of items) {
            switch (fieldName) {
                case "creator":
                    oldValue = JSON.stringify(item.getCreators());
                    break;
                default:
                    oldValue = item.getField(fieldName);
            }
            if (newValue != oldValue) {
                changes++;
                switch (fieldName) {
                    case "creator":
                        item.setCreators(JSON.parse(newValue));
                        break;
                    default:
                        let mappedFieldID = Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, fieldName);
                        item.setField(mappedFieldID ? mappedFieldID : fieldID, newValue);
                }
                await item.save();
            }
        }
    });
}
return changes + " item(s) modified";