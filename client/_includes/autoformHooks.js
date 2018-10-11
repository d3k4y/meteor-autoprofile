import {Blaze} from "meteor/blaze";
// eslint-disable-next-line import/no-unresolved
import {AutoForm} from 'meteor/aldeed:autoform';
import {_} from "meteor/erasaur:meteor-lodash";
import toastr from 'toastr';


/**
 * DOCUMENTATION:
 *      - https://github.com/aldeed/meteor-autoform#callbackshooks
 */
AutoForm.addHooks(['AutoProfileEditForm_UpdateSet', 'AutoProfileEditForm_UpdateSetQuick'], {
    before: {
        enhancedmethod: function (doc) {
            const dbDoc = this.collection.findOne(this.currentDoc._id);
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

            const updateDoc = {};
            _.keys(doc).forEach(key => {
                if (doc[key] !== dbDoc[key]) {
                    updateDoc[key] = doc[key];
                }
            });
            updateDoc._id = this.currentDoc._id;

            const beforeUpdateHook = window[_.get(this, 'formAttributes.callContext.onBeforeUpdate')];
            if (typeof beforeUpdateHook === 'function') {
                beforeUpdateHook.call(this, dbDoc, updateDoc);
            }

            this.result(updateDoc);
        },
    },
    onSuccess(formType, result) {
        console.error('onSuccess', this);
        // const autoProfileTemplate = this.template.view.template.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert');
    },
    onError(formType, error) { toastr.error(`Beim Erstellen des Benutzerprofils ist ein Fehler aufgetreten: ${error}`); }
});

AutoForm.addHooks(['AutoProfileEditForm_UpdateSetQuick'], {
    after: {
        enhancedmethod: function (foo, bar, bla) {
            const parent = $(this.template.firstNode.parentNode);
            const field = parent.find('.autoprofile-field');
            field.removeClass('d-none');
            const quickformTemplate = this.template.parent((instance) => { return instance.view.name === 'Template.quickForm'; });
            Blaze.remove(quickformTemplate.view);
        }
    },
});

AutoForm.addHooks(['AutoProfileEditForm_UpdateDoc'], {
    before: {
        enhancedmethod: function (doc) {
            const dbDoc = this.collection.findOne(this.currentDoc._id);
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
            const mergedDoc = _.merge({}, dbDoc || {}, doc);
            mergedDoc._id = this.currentDoc._id;
            const mydoc = _.cloneDeep(mergedDoc);
            this.result(mydoc);

            /*
            this.result({
                _id: this.currentDoc._id,
                profile: _.merge({}, dbDoc.profile || {}, doc.profile)
            });
            */
        },
    },
    onSuccess(formType, result) { toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert'); },
    onError(formType, error) { toastr.error(`Beim Erstellen des Benutzerprofils ist ein Fehler aufgetreten: ${error}`); }
});


AutoForm.addHooks(['AutoProfileAddArrayItemForm'], {
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
            const mergedDoc = _.merge({}, dbDoc || {}, doc);
            mergedDoc._id = this.currentDoc._id;
            this.result(_.cloneDeep(mergedDoc));

            /*
            this.result({
                _id: this.currentDoc._id,
                profile: _.merge({}, dbDoc.profile || {}, doc.profile)
            });
            */
        },
    },
    onSuccess(formType, result) { toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert'); },
    onError(formType, error) { toastr.error(`Beim Speichern des Benutzerprofils ist ein Fehler aufgetreten: ${error}`); }
});