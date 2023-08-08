// see https://www.zotero.org/support/dev/client_coding/javascript_api#batch_editing
// From Dan Stillman at https://forums.zotero.org/discussion/80506/
// first make a backup of zotero.sqlite in your Zotero data directory with Zotero closed and then go to Tools → Developer → Run JavaScript
// combined with code from https://forums.zotero.org/discussion/7707/find-and-replace-on-multiple-items/p2
// by tanaree https://forums.zotero.org/profile/1648161/tanaree April 17, 2014

// For creators, sample JSON is [{"fieldMode":0,"firstName":"Israel","lastName":"Knohl","creatorTypeID":1}]
// so the regExFil should include the colon and double quotes like /"firstName":"Ken(neth)?"/gm
// and the replaceText should be in single quotes and double quotes like '"firstName":"Ken M."'

fieldDataList = [
    {
        "name": "creatorTitleCase",
        "fieldName": "creator",
        "regExFilt": /("lastName":"[A-Z\u00C0-\u00DC])([A-Z\u00C0-\u00DC]+)(")/u,
        "replaceText": (match, p1, p2, p3) => p1 + p2.toLowerCase() + p3
    },
    {
        "name": "creatorCommaSplit",
        "fieldName": "creator",
        "regExFilt": /"fieldMode":[01],"firstName":"([-. A-Za-zÀ-ÿ]+)?","lastName":"([-. A-Za-zÀ-ÿ]+), ([-. A-Za-zÀ-ÿ]+)"/gm,
        "replaceText": '"fieldMode":0,"firstName":"$1$3","lastName":"$2"'
    },
   {
        "name": "titleSpace",
        "fieldName": "title",
        "regExFilt": "/  /gm",
        "replaceText": " "
    },
       
    {
        "name": "creatorComma",
        "fieldName": "creator",
        "regExFilt": /(.+[a-z]),(",)/g,
        "replaceText": "$1$2"
    },
     {
        "name": "creatorInitialDotFirst",
        "fieldName": "creator",
        "regExFilt": /("firstName":"[A-Z\u00C0-\u00DC])( )/g,
        "replaceText": "$1\.$2"
    },
    {
        "name": "creatorInitialDotFinal",
        "fieldName": "creator",
        "regExFilt": /("firstName":"[A-Z a-z.\u00C0-\u00DC]*[A-Z\u00C0-\u00DC])(")/g,
        "replaceText": "$1\.$2"
    },
    {
        "name": "creatorInitialDotMedial",
        "fieldName": "creator",
        "regExFilt": /("firstName":"[A-Z a-z.\u00C0-\u00DC]*[A-Z\u00C0-\u00DC])( )/g,
        "replaceText": "$1\.$2"
    },
    {
        "name": "creatorDotSpace",
        "fieldName": "creator",
        "regExFilt": /("firstName":"[-A-Z a-z\u00C0-\u00DC.]*[A-Z\u00C0-\u00DC]\.)([A-Z])/g,
        "replaceText": "$1 $2"
    },
    {
        "name": "Press",
        "fieldName": "publisher",
        "regExFilt": / Press$/gm,
        "replaceText": ""
    }/*
    {
        "name": "creatorParticle",
        "fieldName": "creator",
        "regExFilt": /("firstName":".+)(De|Van|Der|Le|Von|Dos)( |")/gm,
        "replaceText": (match, p1, p2, p3) => p1 + p2.toLowerCase() + p3
    }    ,
    {
        "name": "creatorMoveParticle",
        "fieldName": "creator",
        "regExFilt": /("firstName":"[-A-Za-zÀ-ÿ .]+)(","lastName":")([Dd]e|[Vv]an|[Dd]er|[Ll]e|[Vv]on|[Dd][oa]s) /gm,
        "replaceText": "$1 $3$2"
    },
    {
        "name": "creatorLiteralToFamilyAndGiven",
        "fieldName": "creator",
        "regExFilt": /"fieldMode":[01],"firstName":"([-. A-Za-zÀ-ÿ]+)?","lastName":"([A-Z]\.) ([-. A-Za-zÀ-ÿ]+)"/gm,
        "replaceText": '"fieldMode":0,"firstName":"$1$2","lastName":"$3"'
    },
    {
        "name": "creatorParticle",
        "fieldName": "creator",
        "regExFilt": /("firstName":".+)(De|Van|Der|Le|Von|Dos)( |")/gm,
        "replaceText": (match, p1, p2, p3) => p1 + p2.toLowerCase() + p3
    },
    {
        "name": "0 page",
        "fieldName": "pages",
        "regExFilt": "/^0/",
        "replaceText": ""
    },
    {
        "name": "Barr",
        "fieldName": "creator",
        "regExFilt": /("firstName":")(J[ames.]*)(","lastName":"Barr")/gm,
        "replaceText": "$1James$3"
    }*/
];

var totalChanges = 0;
//    alert(JSON.stringify(fieldDataList));
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
//                    alert(oldValue);
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

return totalChanges + " item(s) modified in total";
