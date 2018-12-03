import {Blaze} from "meteor/blaze";
import {AutoForm} from 'meteor/aldeed:autoform';
import {_} from "meteor/erasaur:meteor-lodash";


function executeCallback(type, context, args, rtrn = null) {
    const types = {
        modify: 'autoprofileState_ModifyCallback',
        success: 'autoprofileState_SuccessCallback',
        error: 'autoprofileState_ErrorCallback',
    };
    const typeKey = types[type];
    if (typeKey) {
        const callback = window[typeKey].get();
        if (typeof callback === 'function') {
            return callback.apply(context, args);
        }
    }
    return rtrn;
}
function executeModifyCallback(context, args, doc) {
    return executeCallback('modify', context, args, doc);
}
function executeSuccessCallback(context, args) {
    return executeCallback('success', context, args);
}
function executeErrorCallback(context, args) {
    return executeCallback('success', context, args);
}

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
            _.keys(doc).forEach((key) => {
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
        executeSuccessCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), result, formType]);
    },
    onError(formType, error) {
        executeErrorCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), error, formType]);
        console.error('AutoProfileAddArrayItemForm onError', this, formType, error);
    }
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
    onSuccess(formType, result) {
        executeSuccessCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), result, formType]);
    },
    onError(formType, error) {
        executeErrorCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), error, formType]);
        console.error('AutoProfileAddArrayItemForm onError', this, formType, error);
    }
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
            this.result(this.collection._c2._simpleSchema.clean(_.cloneDeep(mergedDoc)));

            /*
            this.result({
                _id: this.currentDoc._id,
                profile: _.merge({}, dbDoc.profile || {}, doc.profile)
            });
            */
        },
    },
    onSuccess(formType, result) {
        executeSuccessCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), result, formType]);
    },
    onError(formType, error) {
        executeErrorCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), error, formType]);
        console.error('AutoProfileAddArrayItemForm onError', this, formType, error);
    }
});


AutoForm.addHooks(['AutoProfileCreateReferenceDocAndAddArrayItemForm'], {
    before: {
        method: function (doc) {
            const callContext = _.get(this, 'formAttributes.callContext');
            doc[callContext.fieldName] = callContext.fieldValue;
            this.result(executeModifyCallback(this, [doc, callContext.fieldDefinition, callContext], doc));
        },
    },
    onSuccess(formType, result) {
        executeSuccessCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), result, formType]);
    },
    onError(formType, error) {
        executeErrorCallback(this, [_.get(this, 'formAttributes.callContext.fieldDefinition'), error, formType]);
        console.error('AutoProfileCreateReferenceDocAndAddArrayItemForm onError', this, formType, error);
    }
});
