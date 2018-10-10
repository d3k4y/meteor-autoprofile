/* eslint-disable consistent-return,default-case,no-case-declarations,meteor/template-names,meteor/prefix-eventmap-selectors */
import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {_} from "meteor/erasaur:meteor-lodash";
import moment from 'moment';
import toastr from "toastr";
import wNumb from "wnumb";

import {SimpleSchemaFunctions} from "meteor/corefi:meteor-simple-schema-functions";

import './_includes/autoformHook';
import './autoprofile.html';
import './autoprofile.css';


function dbg(...params) {
    // console.error.apply(this, params);
}

/* AutoProfile public methods */
function getData (templateInstance) {
    const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
    if (autoProfileTemplate) {
        return autoProfileTemplate.data;
    }
}
function getOptions (templateInstance) {
    const data = getData(templateInstance);
    if (data) {
        return data.options;
    }
}
function getContext (templateInstance) {
    const data = getData(templateInstance);
    if (data) {
        return data.myContext;
    }
}

function unifyNamespace (namespace) {
    let ns = [];
    if (namespace) {
        if (typeof namespace === "string") {
            ns = [namespace];
        } else if (namespace instanceof Array) {
            ns = namespace;
        }
    }
    return ns;
}

function getNamespaceContext (context, namespace) {
    if (context) {
        const ns = unifyNamespace(namespace);
        if (ns.length > 0) {
            return context[ns[0]];
        }
    }
    return context;
}

function getFieldValue (templateInstance, id, context, options) {
    if (_.isString(id)) {
        const idSplit = id.split('.');
        const namespace = idSplit.length > 1 ? _.first(idSplit) : null;
        const name = _.last(idSplit);
        const fieldContext = getNamespaceContext(getContext(templateInstance), namespace);
        const profileOptions = getOptions(templateInstance);
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, id) || SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, id);
        if (fieldContext) {
            const value = fieldContext[name] || context[name];
            if (fieldSchema) {
                const afFieldInput = fieldSchema.autoform ? fieldSchema.autoform.afFieldInput : null;
                if (fieldSchema.type.singleType === Date) {
                    if (options && options.dateformat) {
                        return moment(value).format(options.dateformat);
                    }
                    // moment(value).format("DD.MM.YYYY [um] HH:mm")
                    return value;
                } else if (fieldSchema.type.singleType === String && afFieldInput && afFieldInput.type === "fileUpload") {
                    const collection = window[afFieldInput.collection];
                    if (collection) {
                        const file = collection.find({_id: value}).fetch();
                        if (file && file.length > 0) {
                            return file[0];
                        }
                        return false;
                    }
                }
            } else {
                dbg('getFieldValue: fieldSchema not found', name, id);
            }
            return value;
        }
        dbg('getFieldValue: not found', id, fieldContext);
    }
    return null;
}


// TODO, FIXME: missing cases:
//   - decimal
//   - integer
function getTemplate (templateInstance, context) {
    const profileOptions = getOptions(templateInstance);
    const fullName = context.namespace ? `${context.namespace}.${context.id || context.name}` : context.id || context.name;
    if (context.type) { return context.type; }
    if (context.template) { return context.template; }
    const fieldSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, fullName) || SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, context.id);
    if (fieldSchema) {
        switch (fieldSchema.type.singleType) {
            case Object: return "autoProfileField_object";
            case Number: return "autoProfileField_string";
            case Date: return "autoProfileField_date";
            case String:
                const autoform = fieldSchema.autoform;
                if (context.reference) {
                    return "autoProfileField_string_reference";
                }
                if (autoform) {
                    if (autoform.rows > 0 || autoform.type === "markdown") {
                        return "autoProfileField_string_textarea";
                    }
                    const afFieldInput = autoform.afFieldInput;
                    if (afFieldInput) {
                        switch (afFieldInput.type) {
                            case 'fileUpload':
                                if (afFieldInput.accept && afFieldInput.accept.substr(0, 6) === "image/") {
                                    return "autoProfileField_image";
                                }
                                return "autoProfileField_file";
                            case 'fileUploadReference':
                                return "autoProfileField_fileReference";
                        }
                    }
                }
                return "autoProfileField_string";
            case Array:
                const subSchema = SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, `${fullName}.$`);
                if (subSchema) {
                    switch (subSchema.type.singleType) {
                        case Object: return "autoProfileField_array_object";
                        case String: return "autoProfileField_array";
                    }
                }
                return "autoProfileField_array";
        }
    } else {
        dbg('getTemplate: fieldSchema not found!', fullName, context.id);
    }
    return "autoProfileField_string";
}


Template.autoProfile.onCreated(function onRendered() {
    window.autoprofileState_FieldId = this.currentFieldId = new ReactiveVar('');
    window.autoprofileState_ArrayIndex = this.currentArrayIndex = new ReactiveVar('');
});

Template.autoProfile.helpers({
    getFields() {
        return Template.instance().currentFieldId.get();
    },
    getContext() {
        return Template.instance().data.myContext;
    },
    getOptions() {
        return Template.instance().data.options;
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
        const profileOptions = getOptions(Template.instance());
        const context = getContext(Template.instance());
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
            return this.format.call(instance, fieldValue);
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
        const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        const $elem = $(event.currentTarget);
        // TODO: check for autoProfileTemplate.data.options.editingEnabled ?
        if (typeof templateInstance.data.editable === 'undefined' || templateInstance.data.editable) {
            const arrayIndex = $elem.attr('data-array-index');
            autoProfileTemplate.currentArrayIndex.set(arrayIndex);
            autoProfileTemplate.currentFieldId.set(arrayIndex ? `${$elem.closest('[data-field-id]').attr('data-field-id')}.${arrayIndex}` : $elem.attr('data-field-id'));
            Meteor.defer(() => { $('.autoprofile-container .js-edit-field-afmodalbutton')[0].click(); });
        }
    },

    'click .js-autoprofile-add-array-item'(event, templateInstance, doc) {
        const autoProfileTemplate = templateInstance.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        const $elem = $(event.currentTarget);
        if (typeof templateInstance.data.editable === 'undefined' || templateInstance.data.editable) {
            autoProfileTemplate.currentFieldId.set(`${$elem.closest('[data-field-id]').attr('data-field-id')}.999999`);
            autoProfileTemplate.currentArrayIndex.set(null);
            Meteor.defer(() => { $('.autoprofile-container .js-add-array-item-afmodalbutton')[0].click(); });
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    'click .js-autoprofile-remove-array-item'(event, templateInstance, doc) {
        const profileOptions = getOptions(templateInstance);
        const $elem = $(event.currentTarget);
        if (typeof templateInstance.data.editable === 'undefined' || templateInstance.data.editable) {
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
Template.autoProfileField_date.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_string_textarea.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_array.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_object.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_array_object.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_string_reference.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_fileReference.inheritsHelpersFrom('autoProfileField_string');

// Template.autoProfileFieldHelper_editable.inheritsHelpersFrom('autoProfileField_string');

// inherit default eventmap
Template.autoProfileField_image.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_file.inheritsEventsFrom('autoProfileField_string');
Template.autoProfileField_fileCheck.inheritsEventsFrom('autoProfileField_string');
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
            console.error('getLink', this);
            return this.link.call(this, fieldValue, fieldSchema);
        }
        return null;
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
        if (refId && ref && ref.collection) {
            const relObj = ref.collection.findOne(refId);
            if (relObj) {
                return relObj[ref.labelField && (ref.labelField.id || ref.labelField)];
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
        if (parent && parent.data && parent.data.data && parent.data.data.titleField) {
            const titleField = parent.data.data.titleField;
            return `<span data-field-id="${titleField.id || titleField}">${getFieldValue(parent, titleField.id || titleField, this)}</span>`;
        }
        return "Error: titleField not set in array of objects context";
    },
    contentFieldValue() {
        const templateInstance = Template.instance();
        const parent = templateInstance.parent();
        if (parent && parent.data && parent.data.data && parent.data.data.subfields && parent.data.data.subfields.length > 0) {
            const subfields = parent.data.data.subfields;
            let value = null;
            for (let i = 0; i < subfields.length; i++) {
                const subfield = subfields[i];
                const templateName = getTemplate(templateInstance, subfield);
                const fieldValue = getFieldValue(parent, subfield.id, this);
                if (templateName === "autoProfileField_file") {
                    const href = `/cdn/storage/${fieldValue._collectionName}/${fieldValue._id}/original/${fieldValue._id}.${fieldValue.extension}`;
                    return `<a href="${href}" target="_blank">${fieldValue.name}</a>`;
                }
                if (i === 0) {
                    value = `<span data-field-id="${subfield.id}">${fieldValue}</span>`;
                } else {
                    value += ` <span data-field-id="${subfield.id}">${fieldValue}</span>`;
                }
            }
            return value;
        }
        return "Error: subfields not Set in array of objects context";
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
            const collection = window[afFieldInput.collection];
            if (collection) {
                const referencedObject = collection.findOne(fieldValue);
                console.error('autoProfileField_fileReference referencedObject', this, instance, fieldSchema, afFieldInput.collection, fieldValue, referencedObject);
                return referencedObject;
            }
        }

    }
});