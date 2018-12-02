/* eslint-disable consistent-return,default-case,no-case-declarations,meteor/template-names,meteor/prefix-eventmap-selectors */
import {SimpleSchemaGroup} from "simpl-schema";
import {Meteor} from 'meteor/meteor';
import {Blaze} from "meteor/blaze";
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {_} from "meteor/erasaur:meteor-lodash";
import moment from 'moment';
import toastr from "toastr";

import {SimpleSchemaFunctions} from "meteor/corefi:meteor-simple-schema-functions";

import './_includes/autoformHooks';
import {dbg, getData, getOptions, getContext, unifyNamespace, getNamespaceContext, getFieldValue, getTemplate, getCollectionByName} from './_includes/_api';

import './autoprofile.html';
import './_includes/fieldTypes/stringReference.html';
import './_includes/fieldTypes/fileReference.html';
import './_includes/fieldTypes/string.html';
import './_includes/fieldTypes/stringTextarea.html';
import './_includes/fieldTypes/image.html';
import './_includes/fieldTypes/file.html';
import './_includes/fieldTypes/fileCheck.html';
import './_includes/fieldTypes/fileCheckArray.html';
import './_includes/fieldTypes/date.html';
import './_includes/fieldTypes/object.html';
import './_includes/fieldTypes/array.html';
import './_includes/fieldTypes/arrayObject.html';
import './autoprofile.css';


Template.autoProfile.onCreated(function onRendered() {
    window.autoprofileState_FieldId = this.currentFieldId = new ReactiveVar('');
    window.autoprofileState_CallContext = this.currentCallContext = new ReactiveVar(null);
    window.autoprofileState_ArrayIndex = this.currentArrayIndex = new ReactiveVar('');
    window.autoprofileState_CollectionName = this.currentCollectionName = new ReactiveVar(null);
    window.autoprofileState_DocumentId = this.currentDocumentId = new ReactiveVar(null);
    window.autoprofileState_Method = this.currentMethod = new ReactiveVar(null);
    window.autoprofileState_ModifyCallback = this.currentModifyCallback = new ReactiveVar(null);
    window.autoprofileState_SuccessCallback = this.currentSuccessCallback = new ReactiveVar(null);
    window.autoprofileState_ErrorCallback = this.currentErrorCallback = new ReactiveVar(null);
});

Template.autoProfile.onRendered(function onRendered() {
    const self = this;
    $("#afModal").on("hidden.bs.modal", function () {
        self.currentCollectionName.set(null);
        self.currentDocumentId.set(null);
        self.currentMethod.set(null);
        self.currentModifyCallback.set(null);
        self.currentSuccessCallback.set(null);
        self.currentErrorCallback.set(null);
    });
});

Template.autoProfile.helpers({
    getFields() {
        return Template.instance().currentFieldId.get();
    },
    getCallContext() {
        return Template.instance().currentCallContext.get();
    },
    getContext() {
        return getContext(Template.instance());
    },
    getOptions() {
        return Template.instance().data.options;
    },
    getMethod() {
        return Template.instance().currentMethod.get() || Template.instance().data.options.method;
    },
    getMethodArgs() {
        return Template.instance().data.options.methodargs;
    },
    getDocId() {
        const context = getContext(Template.instance());
        return Template.instance().currentDocumentId.get() || context ? context._id : null;
    },
    getCollectionName() {
        return Template.instance().currentCollectionName.get() || Template.instance().data.options.collectionName;
    },
    getInstance() {
        return Template.instance();
    },
    getEditFormId() {
        const options = Template.instance().data.options;
        return options.updateType === 'updateSet' ? 'AutoProfileEditForm_UpdateSet' : 'AutoProfileEditForm_UpdateDoc';
    }
});

/* AutoProfile Panel */
Template.autoProfilePanel.helpers({
    cardOrPanel() {
        return 'card' || 'panel';
    },
    headerOrHeading() {
        return 'header' || 'heading';
    },
    panelTitle() {
        const profileOptions = getOptions(Template.instance());
        if (this.title) {
            return this.title;
        }
        if (this.field) {
            return _.get(SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.field.id), 'label');
        }
    },
    getTemplate() {
        return getTemplate(Template.instance(), this);
    },
});


/* AutoProfile Fields */
Template.autoProfileField_string.helpers({
    options() {
        return getOptions(Template.instance());
    },
    context() {
        return getContext(Template.instance());
    },
    isEditable() {
        if (this.fieldOptions && this.fieldOptions.value) { return false; }
        let fieldOptions = Template.instance().data.fieldOptions;
        if (!fieldOptions) { fieldOptions = Template.instance().data; }
        return fieldOptions && (typeof fieldOptions.editable === 'undefined' || fieldOptions.editable);
    },
    getView() {
        const panelTemplate = Template.instance().parent((instance) => { return instance.view.name === 'Template.autoProfilePanel'; });
        return panelTemplate && panelTemplate.data ? panelTemplate.data.view : null;
    },
    isUrl() {
        const profileOptions = getOptions(Template.instance());
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.id || this);
        if (fieldSchema && fieldSchema.autoprofile) {
            return fieldSchema.autoprofile.isUrl;
        }
    },
    editingEnabled() {
        const options = getOptions(Template.instance());
        if (options) {
            return options.editingEnabled;
        }
    },
    fieldTitle() {
        const profileOptions = getOptions(Template.instance());
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.id);
        if (this.title) {
            if (typeof this.title === 'function') {
                return this.title.call(this, fieldSchema, profileOptions);
            }
            return this.title;
        }
        return fieldSchema ? fieldSchema.label : null;
    },
    fieldId() {
        return this.id || this;
    },
    fieldValue(raw = false) {
        const instance = Template.instance();
        const profileOptions = getOptions(instance);
        const context = getContext(instance);
        const fieldValue = getFieldValue(instance, this.id || this, this);
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.id);
        const autoformOptions = _.get(fieldSchema, 'autoform.options');
        if (autoformOptions) {
            const option = _.find(autoformOptions, function(data) { return data.value === fieldValue; });
            if (option) {
                return option.label;
            }
        }
        if (this.value) {
            if (typeof this.value === 'function') {
                return this.value.call(this, context, fieldValue, instance);
            }
            return this.value;
        }
        if (typeof this.format === 'function') {
            return this.format.call(instance, fieldValue, fieldSchema);
        }
        if (context && this.reference && this.reference.reverse && !raw) {
            const selector = {};
            const idSplit = this.id.split('.');
            if (idSplit.length > 1) {
                const subSelector = {};
                subSelector[idSplit[2]] = context._id;
                selector[idSplit[0]] = {$elemMatch: subSelector};
            } else {
                selector[this.id] = context._id;
            }
            return getCollectionByName(this.reference.collectionName).find(selector).fetch();
        }
        return fieldValue;
    },
    urlFieldValue() {
        if (this.urlField) {
            return getFieldValue(Template.instance(), this.urlField.id || this.urlField, this);
        }
        return false;
    },
});

Template.autoProfileField_string.events({
    'click .autoprofile-field'(event, templateInstance, doc) {
        const $elem = $(event.currentTarget);
        const $subElem = $elem.find('.autoprofile-title-field-label');
        const $root = $elem.closest('.autoprofile-container');
        const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        const autoProfileOptions = autoProfileTemplate.data.options;
        if (autoProfileOptions.editingEnabled && (typeof templateInstance.data.editable === 'undefined' || templateInstance.data.editable)) {
            const arrayIndex = $elem.attr('data-array-index') || $elem.closest('.autoprofile-field').attr('data-array-index');
            const collectionName = $subElem.attr('data-collection-name');
            const docId = $subElem.attr('data-doc-id');
            const fieldId = $subElem.attr('data-field-id');
            let currentFieldId = fieldId || $elem.attr('data-field-id');
            if (typeof arrayIndex !== 'undefined' && !_.get(templateInstance, 'data.reference')) {
                currentFieldId = `${$elem.closest('[data-field-id]').attr('data-field-id')}.${arrayIndex}`;
            }
            const collection = getCollectionByName(collectionName);
            autoProfileTemplate.currentArrayIndex.set(arrayIndex);
            autoProfileTemplate.currentFieldId.set(currentFieldId);
            autoProfileTemplate.currentCallContext.set(this);
            autoProfileTemplate.currentCollectionName.set(collectionName);
            autoProfileTemplate.currentDocumentId.set(docId);
            if (this.inplaceEditing || (this.fieldOptions && this.fieldOptions.inplaceEditing)) {
                $elem.addClass('d-none');
                const additionalButtonClasses = this.fieldOptions && this.fieldOptions.showButton ? '' : 'd-none';
                Blaze.renderWithData(Template.quickForm, {
                    id: autoProfileOptions.updateType === 'updateSet' ? 'AutoProfileEditForm_UpdateSetQuick' : 'AutoProfileEditForm_UpdateDocQuick',
                    fields: autoProfileTemplate.currentFieldId.get(),
                    collection: $subElem.attr('data-collection-name') || autoProfileOptions.collectionName,
                    meteormethod: autoProfileOptions.method,
                    meteormethodargs: autoProfileOptions.methodargs,
                    doc: docId ? collection.findOne(docId) : autoProfileTemplate.data.myContext,
                    callContext: autoProfileTemplate.currentCallContext.get(),
                    type: 'enhancedmethod',
                    operation: 'update',
                    buttonContent: 'Speichern',
                    buttonClasses: `btn cf-button-modals p-2 ${additionalButtonClasses}`,
                    placeholder: true,
                    template: 'bootstrap4',
                    title: 'Profil bearbeiten',
                    class: 'autoprofile-quickform',
                    validationScope: 'fields',
                    validation: 'keyup',
                    doNotClean: true
                }, $elem.parent()[0]);
            } else {
                Meteor.defer(() => { $root.find('.js-edit-field-afmodalbutton')[0].click(); });
            }
        }
    },

    'click .js-autoprofile-add-array-item'(event, templateInstance, doc) {
        const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        const $elem = $(event.currentTarget);
        const $root = $elem.closest('.autoprofile-container');
        if (autoProfileTemplate.data.options.editingEnabled && (typeof templateInstance.data.editable === 'undefined' || templateInstance.data.editable)) {
            const collectionName = _.get(this, 'reference.collectionName');
            const currentFieldId = this.reference ? _.get(this, 'titleField.id') : `${$elem.closest('[data-field-id]').attr('data-field-id')}.999999`;
            autoProfileTemplate.currentFieldId.set(currentFieldId);
            autoProfileTemplate.currentArrayIndex.set(null);
            autoProfileTemplate.currentCollectionName.set(collectionName);
            autoProfileTemplate.currentDocumentId.set(null);
            if (_.get(this, 'reference.reverse')) {
                autoProfileTemplate.currentCallContext.set({
                    fieldName: this.id,
                    fieldValue: getContext(templateInstance)._id,
                    fieldDefinition: this
                });
                autoProfileTemplate.currentMethod.set(_.get(this, 'reference.insert.method'));
                autoProfileTemplate.currentModifyCallback.set(_.get(this, 'reference.insert.onBefore'));
                autoProfileTemplate.currentSuccessCallback.set(_.get(this, 'reference.insert.onSuccess'));
                autoProfileTemplate.currentErrorCallback.set(_.get(this, 'reference.insert.onError'));
                Meteor.defer(() => { $root.find('.js-create-reference-doc-and-add-array-item-afmodalbutton')[0].click(); });
            } else {
                autoProfileTemplate.currentCallContext.set(this);
                Meteor.defer(() => { $root.find('.js-add-array-item-afmodalbutton')[0].click(); });
            }
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    'click .js-autoprofile-remove-array-item'(event, templateInstance, doc) {
        const profileOptions = getOptions(templateInstance);
        const $elem = $(event.currentTarget);
        const data = templateInstance.data;
        if (typeof data.editable === 'undefined' || data.editable) {
            if (_.get(data, 'reference.reverse')) {
                const deleteConf = _.get(data, 'reference.delete');
                Meteor.call(deleteConf.method, this._id, (error) => {
                    if (error) deleteConf.onError.call(this, data, error);
                    else deleteConf.onSuccess.call(this, data);
                });
            } else {
                const $base = $elem.closest('[data-array-index]');
                const arrayIndex = $base.attr('data-array-index');
                const fieldIdSplit = `${$base.closest('[data-field-id]').attr('data-field-id')}`.split('.');
                const dbDoc = profileOptions.collection.findOne(getContext(templateInstance)._id);
                let currentDbDoc = dbDoc;
                for (let i = 0; i < fieldIdSplit.length; i++) {
                    currentDbDoc = currentDbDoc[fieldIdSplit[i]];
                }
                currentDbDoc.splice(arrayIndex, 1);
                Meteor.call(profileOptions.method, dbDoc, (error) => {
                    if (error) {
                        toastr.error(`Beim Speichern des Benutzerprofils ist ein Fehler aufgetreten: ${error}`);
                    } else {
                        toastr.success('Das Benutzerprofil wurde erfolgreich aktualisiert');
                    }
                });
            }
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
});


Template.autoProfileFieldHelper_editable.helpers({
    isEditable() {
        if (this.fieldOptions && this.fieldOptions.value) { return false; }
        const fieldOptions = Template.instance().data.fieldOptions;
        return fieldOptions && (typeof fieldOptions.editable === 'undefined' || fieldOptions.editable);
    }
});


// inherit default helpers
Template.autoProfilePanel.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_image.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_file.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_fileCheck.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_fileCheckArray.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_date.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_string_textarea.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_array.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_object.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_array_object.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_string_reference.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_fileReference.inheritsHelpersFrom('autoProfileField_string');

Template.autoProfileField_fileCheckArray.inheritsHelpersFrom('autoProfileField_fileCheck');
// Template.autoProfileFieldHelper_editable.inheritsHelpersFrom('autoProfileField_string');

// inherit default eventmap
Template.autoProfileField_image.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_file.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_fileCheck.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_fileCheckArray.inheritsEventsFrom('autoProfileField_fileCheck');
Template.autoProfileField_date.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_string_textarea.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_array.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_object.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_array_object.inheritsEventsFrom('autoProfileField_string');


Template.autoProfileField_fileCheck.helpers({
    getLink() {
        if (typeof this.link === 'function') {
            const instance = Template.instance();
            const fieldValue = getFieldValue(instance, this.id, this);
            const fieldSchema = SimpleSchemaFunctions.getFieldSchema(getOptions(instance).collection, this.id);
            return this.link.call(this, fieldValue, fieldSchema);
        }
        return null;
    }
});

Template.autoProfileField_fileCheckArray.helpers({
    getLinkArray(value) {
        if (typeof this.link === 'function') {
            const instance = Template.instance();
            const fieldSchema = SimpleSchemaFunctions.getFieldSchema(getOptions(instance).collection, value);
            return this.link.call(this, value, fieldSchema);
        }
        return null;
    },

    getFilename(value) {
        if (value) {
            const collection = window.Files;
            if (collection) {
                try {
                    return collection.findOne({_id: value}).name;
                } catch (error) {
                    // error
                }
            }
        }
    }
});

/* Extend Field: String ID Reference to different Collection */
Template.autoProfileField_string_reference.helpers({
    referenceUrl() {
        const refId = getFieldValue(Template.instance(), this.id || this, this);
        return this.reference.urlPrefix + refId;
    },
    referenceLabel() {
        const ref = this.reference;
        const refId = getFieldValue(Template.instance(), this.id || this, this);
        if (refId && ref && ref.collectionName) {
            const collection = getCollectionByName(ref.collectionName);
            if (collection) {
                const relObj = collection.findOne(refId);
                if (relObj) {
                    return relObj[ref.labelField && (ref.labelField.id || ref.labelField)];
                }
            }
        }
    },
});

/* Extend Field: AutoProfile array of objects Field */
Template.autoProfileField_array_object.helpers({
    renderInplace() {
        return this.render === "inplace";
    },
    titleFieldValue() {
        const parent = Template.instance().parent();
        const data = _.get(parent, 'data.data');
        const titleField = _.get(parent, 'data.data.titleField');
        if (titleField) {
            const reference = data.reference;
            const titleFieldValue = getFieldValue(parent, titleField.id || titleField, this);
            if (reference && reference.reverse) {
                return `
                    <span 
                        class="autoprofile-title-field-label" 
                        data-field-id="${titleField.id || titleField}" 
                        data-collection-name="${reference.collectionName}" 
                        data-doc-id="${this._id}">${this[titleField.id]}
                    </span>`;
            }
            return `<span  class="autoprofile-field-label" data-field-id="${titleField.id || titleField}">${titleFieldValue}</span>`;
        }
        return 'Error: titleField not set in array of objects context';
    },
    contentFieldValue() {
        const templateInstance = Template.instance();
        const parent = templateInstance.parent();
        const data = _.get(parent, 'data.data');
        const reference = data.reference;
        const subfields = _.get(parent, 'data.data.subfields');
        if (subfields && subfields.length > 0) {
            let value = null;
            for (let i = 0; i < subfields.length; i++) {
                const subfield = subfields[i];
                const templateName = getTemplate(templateInstance, subfield);
                const fieldValue = getFieldValue(parent, subfield.id, this);
                if (templateName === "autoProfileField_file") {
                    const href = `/cdn/storage/${fieldValue._collectionName}/${fieldValue._id}/original/${fieldValue._id}.${fieldValue.extension}`;
                    return `<a href="${href}" target="_blank">${fieldValue.name}</a>`;
                }
                if (i === 0) value = '';
                else value += ' ';
                if (reference && reference.reverse) {
                    const subfieldValue = _.get(this, subfield.id) || '?';
                    value += `
                        <span 
                            data-field-id="${subfield.id || subfield}" 
                            data-collection-name="${reference.collectionName}" 
                            data-doc-id="${this._id}">${subfieldValue}
                        </span>`;
                } else {
                    value += `<span data-field-id="${subfield.id}">${fieldValue}</span>`;
                }
            }
            return value;
        }
        // return "Error: subfields not Set in array of objects context";
        return '';
    },
});


Template.autoProfileField_object.helpers({
    fieldValueAsJSON() {
        return JSON.stringify(getFieldValue(Template.instance(), this.id, this));
    }
});


Template.autoProfileField_fileReference.helpers({
    referencedObject() {
        const instance = Template.instance();
        const fieldValue = getFieldValue(instance, this.id, this);
        const profileOptions = getOptions(instance);
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.id);
        const afFieldInput = _.get(fieldSchema, 'autoform.afFieldInput');
        if (afFieldInput) {
            const collection = getCollectionByName(afFieldInput.collection);
            if (collection) {
                return collection.findOne(fieldValue);
            }
        }
    }
});
