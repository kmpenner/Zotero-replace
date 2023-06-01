// see https://www.zotero.org/support/dev/client_coding/javascript_api#batch_editing
// From Dan Stillman at https://forums.zotero.org/discussion/80506/
// first make a backup of zotero.sqlite in your Zotero data directory with Zotero closed and then go to Tools → Developer → Run JavaScript
// combined with code from https://forums.zotero.org/discussion/7707/find-and-replace-on-multiple-items/p2
// by tanaree https://forums.zotero.org/profile/1648161/tanaree April 17, 2014

// Example to replace two spaces with one in titles:
//var fieldName = "title";
//var regExFilt = /  /gm;
//var replaceText = " ";

// For creators, sample JSON is [{"fieldMode":0,"firstName":"Israel","lastName":"Knohl","creatorTypeID":1}]
// so the regExFil should include the colon and double quotes like /"firstName":"Ken(neth)?"/gm
// and the replaceText should be in single quotes and double quotes like '"firstName":"Ken M."'

// Example to remove trailing comma in a creator's name:
//var fieldName = "creator";
//var regExFilt = /(.+[a-z]),(",)/g;
//var replaceText = "$1$2";

// Example to lowercase dropping particles (at the end of given name) in a creator's name:
//const fieldName = "creator";
//const regExFilt = /("firstName":".+)(De|Van|Der|Le|Von)( |")/gm;
//const replaceText = (match, p1, p2, p3) => p1 + p2.toLowerCase() + p3;

// Example to change a non-dropping particle (at the beginning of the family name) to a dropping particle (at the end of given name):
//const fieldName = "creator";
//const regExFilt = /("firstName":"[A-Za-z ]+)(","lastName":")([Dd]e|[Vv]an|[Dd]er|[Ll]e|[Vv]on) /gm;
//const replaceText = "$1 $3$2"

// Example to Title case an UPPERCASE surname:
//const fieldName = "creator";
//const regExFilt = /("lastName":"[A-Z\u00C0-\u00DC])([A-Z\u00C0-\u00DC]+)(")/u;
//const replaceText = (match, p1, p2, p3) => p1 + p2.toLowerCase() + p3;

// Example to change *AQ: to Q: in a note:
//var fieldName = "note";
//var regExFilt = /\*AQ:/gm;
//var replaceText = "Q:";

// Example in publisher:
//const fieldName = "publisher";
//const regExFilt = /Publishing Plc,/m;
//const replaceText = "";

// Example to add period after first initial:
//const fieldName = "creator";
//const regExFilt = /("firstName":"[A-Z])( )/g;
//const replaceText = "$1\.$2";

// Example to add period after final initial:S
//const fieldName = "creator";
//const regExFilt = /("firstName":"[A-Z a-z]*[A-Z])(")/g;S
//const replaceText = "$1\.$2";
// Example to add period after medial initial:
//const fieldName = "creator";
//const regExFilt = /("firstName":"[A-Z a-z.]*[A-Z])( )/g;
//const replaceText = "$1\.$2";

const fieldDataList = [
    {
        fieldName: "creator",
        regExFilt: /("firstName":"[A-Z])( )/g,
        replaceText: "$1\.$2"
    },
    // Add more fieldData objects as needed
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

    console.log(changes + " item(s) modified for fieldName: " + fieldData.fieldName);
    totalChanges += changes;
}

return totalChanges + " item(s) modified in total";
