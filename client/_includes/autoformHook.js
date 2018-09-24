// eslint-disable-next-line import/no-unresolved
import {AutoForm} from 'meteor/aldeed:autoform';
import {_} from "meteor/erasaur:meteor-lodash";
import toastr from 'toastr';


/**
 * DOCUMENTATION:
 *      - https://github.com/aldeed/meteor-autoform#callbackshooks
 */
AutoForm.addHooks(['editUserAutoProfileForm'], {
    before: {
        method: function (doc) {
            const dbDoc = this.collection.findOne(this.currentDoc._id);
            const arrayIndex = window.autoprofileState_ArrayIndex.get();
            const fieldId = window.autoprofileState_FieldId.get();
            const fieldIdSplit = fieldId.split('.');
            let currentDoc = doc;
            let currentDbDoc = dbDoc;
            for (let i = 0; i < fieldIdSplit.length; i++) {
                const currentName = fieldIdSplit[i];
                if (_.isArray(currentDoc) && _.isInteger(parseInt(currentName))) {
                    currentDbDoc[currentName] = currentDoc[0];
                    currentDoc.pop();
                }
                currentDoc = currentDoc ? currentDoc[currentName] : currentDoc;
                currentDbDoc = currentDbDoc ? currentDbDoc[currentName] : currentDbDoc;
            }
            this.result({
                _id: this.currentDoc._id,
                profile: _.merge({}, dbDoc.profile || {}, doc.profile)
            });
        },
    },
    onSuccess(formType, result) { toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert'); },
    onError(formType, error) { toastr.error(`Beim Erstellen des Benutzerprofils ist ein Fehler aufgetreten: ${error}`); }
});


AutoForm.addHooks(['addUserAutoProfileArrayItemForm'], {
    before: {
        method: function (doc) {
            const dbDoc = this.collection.findOne(this.currentDoc._id);
            const fieldId = window.autoprofileState_FieldId.get();
            const fieldIdSplit = fieldId.split('.');
            let currentDoc = doc;
            let currentDbDoc = dbDoc;
            for (let i = 0; i < fieldIdSplit.length; i++) {
                const currentName = fieldIdSplit[i];
                if (_.isArray(currentDoc[currentName]) && !currentDbDoc[currentName]) {
                    currentDbDoc[currentName] = [];
                }
                if (_.isArray(currentDoc) && _.isInteger(parseInt(currentName))) {
                    currentDbDoc[currentDbDoc ? currentDbDoc.length : 0] = currentDoc[0];
                    currentDoc.pop();
                }
                currentDoc = currentDoc ? currentDoc[currentName] : currentDoc;
                currentDbDoc = currentDbDoc ? currentDbDoc[currentName] : currentDbDoc;
            }
            this.result({
                _id: this.currentDoc._id,
                profile: _.merge({}, dbDoc.profile || {}, doc.profile)
            });
        },
    },
    onSuccess(formType, result) { toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert'); },
    onError(formType, error) { toastr.error(`Beim Speichern des Benutzerprofils ist ein Fehler aufgetreten: ${error}`); }
});