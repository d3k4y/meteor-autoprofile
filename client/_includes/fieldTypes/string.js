/* eslint-disable meteor/template-names,consistent-return */
import {Meteor} from "meteor/meteor";
import {Blaze} from "meteor/blaze";
import {Template} from 'meteor/templating';
import {_} from "meteor/erasaur:meteor-lodash";
import toastr from "toastr";

import {SimpleSchemaFunctions} from "meteor/corefi:meteor-simple-schema-functions";

import {dbg, getData, getOptions, getContext, unifyNamespace, getNamespaceContext, getFieldValue, getTemplate, getCollectionByName} from '../_api';


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
    'click .js-autoprofile-field'(event, templateInstance, doc) {
        const $elem = $(event.currentTarget);
        const $subElem = $elem.find('.autoprofile-title-field-label');
        const $root = $elem.closest('.autoprofile-container');
        const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        const autoProfileOptions = autoProfileTemplate.data.options;
        if (autoProfileOptions.editingEnabled && (typeof templateInstance.data.editable === 'undefined' || templateInstance.data.editable)) {
            const arrayIndex = $elem.attr('data-array-index') || $elem.closest('.js-autoprofile-field').attr('data-array-index');
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
            autoProfileTemplate.currentModifyCallback.set(autoProfileOptions.onBefore);
            autoProfileTemplate.currentSuccessCallback.set(autoProfileOptions.onSuccess);
            autoProfileTemplate.currentErrorCallback.set(autoProfileOptions.onError);

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
                const options = getOptions(autoProfileTemplate);
                autoProfileTemplate.currentCallContext.set(this);
                autoProfileTemplate.currentModifyCallback.set(options.onBefore);
                autoProfileTemplate.currentSuccessCallback.set(options.onSuccess);
                autoProfileTemplate.currentErrorCallback.set(options.onError);
                Meteor.defer(() => { $root.find('.js-add-array-item-afmodalbutton')[0].click(); });
            }
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    'click .js-autoprofile-remove-array-item'(event, templateInstance, doc) {
        const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        const profileOptions = getOptions(templateInstance);
        const $elem = $(event.currentTarget);
        const data = templateInstance.data;
        if (typeof data.editable === 'undefined' || data.editable) {
            if (_.get(data, 'reference.reverse')) {
                const deleteConf = _.get(data, 'reference.delete');
                autoProfileTemplate.currentModifyCallback.set(null);
                autoProfileTemplate.currentSuccessCallback.set(null);
                autoProfileTemplate.currentErrorCallback.set(null);
                Meteor.call(deleteConf.method, this._id, (error) => {
                    if (error) {
                        console.error('ERROR in autoprofile-remove-array-item reference reverse', deleteConf.method, error);
                        deleteConf.onError.call(this, data, error);
                    }
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

                autoProfileTemplate.currentModifyCallback.set(_.get(this, 'reference.insert.onBefore'));
                autoProfileTemplate.currentSuccessCallback.set(_.get(this, 'reference.insert.onSuccess'));
                autoProfileTemplate.currentErrorCallback.set(_.get(this, 'reference.insert.onError'));

                Meteor.call(profileOptions.method, dbDoc, (error) => {
                    if (error) {
                        console.error('ERROR in autoprofile-remove-array-item reference reverse', error);
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