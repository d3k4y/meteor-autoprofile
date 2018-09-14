/* eslint-disable consistent-return,no-redeclare,default-case,no-case-declarations,meteor/template-names */
import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {SimpleSchema, SimpleSchemaGroup} from 'simpl-schema';
import {_} from "meteor/erasaur:meteor-lodash";
import moment from 'moment';

import {SimpleSchemaFunctions} from "meteor/corefi:meteor-simple-schema-functions";

import './autoprofile.html';
import './autoprofile.css';


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
function getFieldValue (templateInstance, name, id, context, options, namespace) {
    const fieldContext = getNamespaceContext(context || getContext(templateInstance), namespace);
    const fullName = namespace ? `${namespace}.${id || name}` : id || name;
    const fieldSchema = SimpleSchemaFunctions.getFieldSchema(Meteor.users, fullName) || SimpleSchemaFunctions.getFieldSchema(Meteor.users, id);
    if (fieldContext) {
        const value = fieldContext[fullName] || fieldContext[name];
        if (fieldSchema) {
            const subFieldName = _.last(fullName.split('.'));
            const afFieldInput = fieldSchema.autoform ? fieldSchema.autoform.afFieldInput : null;
            if (fieldSchema.type.singleType === Date) {
                if (options && options.dateformat) {
                    return moment(value).format(options.dateformat);
                }
                return moment(value).format("DD.MM.YYYY [um] HH:mm");
            } else if (fieldSchema.type.singleType === String && afFieldInput && afFieldInput.type === "fileUpload") {
                const collection = window[afFieldInput.collection];
                if (collection) {
                    const file = collection.find({_id: value}).fetch();
                    if (file && file.length > 0) {
                        return file[0];
                    }
                    return false;
                }
            } else {
                return fieldContext[subFieldName];
            }
        } else {
            console.error('getFieldValue: fieldSchema not found', name, fullName);
        }
        return value;
    }
    console.error('getFieldValue: not found', fullName, fieldContext);
}


// TODO, FIXME: missing cases:
//   - decimal
//   - integer
function getTemplate (templateInstance, context) {
    const fullName = context.namespace ? `${context.namespace}.${context.id || context.name}` : context.id || context.name;
    const fieldSchema = SimpleSchemaFunctions.getFieldSchema(Meteor.users, fullName) || SimpleSchemaFunctions.getFieldSchema(Meteor.users, context.id);
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
                    console.error('autoform found', fullName, autoform);
                    if (autoform.rows > 0 || autoform.type === "markdown") {
                        return "autoProfileField_string_textarea";
                    }
                    const afFieldInput = autoform.afFieldInput;
                    if (afFieldInput && afFieldInput.type === "fileUpload") {
                        if (afFieldInput.accept && afFieldInput.accept.substr(0, 6) === "image/") {
                            return "autoProfileField_image";
                        }
                        return "autoProfileField_file";
                    }
                }
                return "autoProfileField_string";
            case Array:
                const subSchema = SimpleSchemaFunctions.getFieldSchema(Meteor.users, `${fullName}.$`);
                if (subSchema) {
                    switch (subSchema.type.singleType) {
                        case Object: return "autoProfileField_array_object";
                        case String: return "autoProfileField_array";
                    }
                }
                return "autoProfileField_array";
        }
    } else {
        console.error('getTemplate: fieldSchema not found!', fullName, context.id);
    }
    return "autoProfileField_string";
}


/* AutoProfile Panel */
Template.autoProfilePanel.helpers({
    panelTitle() {
        const schema = SimpleSchemaFunctions.getSchema(Meteor.users);
        if (this.title) {
            return this.title;
        }
        if (this.field) {
            const fullName = this.field.namespace ? `${this.field.namespace}.${this.field.name}` : this.field.name;
            const fieldSchema = SimpleSchemaFunctions.getFieldSchema(Meteor.users, fullName);
            return fieldSchema ? fieldSchema.label : null;
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
    isUrl() {
        const name = this.name ? this.name : this;
        const fullName = this.namespace ? `${this.namespace}.${name}` : name;
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(Meteor.users, fullName);
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
        const fullName = this.namespace ? `${this.namespace}.${this.name}` : this.name;
        const fieldSchema = SimpleSchemaFunctions.getFieldSchema(Meteor.users, fullName);
        return fieldSchema ? fieldSchema.label : null;
    },
    fieldValue() {
        return getFieldValue(Template.instance(), this.name ? this.name : this, this.id, null, this, this.namespace);
    },
    urlFieldValue() {
        if (this.urlField) {
            return getFieldValue(Template.instance(), this.urlField.name ? this.urlField.name : this.urlField, this.urlField.id, null, this, this.namespace);
        }
        return false;
    },
});

// inherit default helpers
Template.autoProfileField_image.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_file.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_date.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_string_textarea.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_array.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_object.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_array_object.inheritsHelpersFrom('autoProfileField_string');
Template.autoProfileField_string_reference.inheritsHelpersFrom('autoProfileField_string');

/* Extend Field: String ID Reference to different Collection */
Template.autoProfileField_string_reference.helpers({
    referenceUrl() {
        const myname = this.name ? this.name : this;
        const ref = this.reference;
        const refId = getFieldValue(Template.instance(), myname, this.id, null, this, this.namespace);
        return ref.urlPrefix + refId;
    },
    referenceLabel() {
        const myname = this.name ? this.name : this;
        const ref = this.reference;
        const refId = getFieldValue(Template.instance(), myname, this.id, null, this, this.namespace);
        if (refId && ref && ref.collection) {
            const relObj = ref.collection.findOne(refId);
            if (relObj) {
                return relObj[ref.labelField && ref.labelField.name ? ref.labelField.name : ref.labelField];
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
            const selfOrProp = titleField.name ? titleField.name : titleField;
            return getFieldValue(parent, selfOrProp, titleField.id, this, null, this.namespace);
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
                const fieldValue = getFieldValue(parent, subfield.name || subfield, subfield.id, this, null, this.namespace);
                if (templateName === "autoProfileField_file") {
                    const href = `/cdn/storage/${fieldValue._collectionName}/${fieldValue._id}/original/${fieldValue._id}.${fieldValue.extension}`;
                    return `<a href="${href}" target="_blank">${fieldValue.name}</a>`;
                }
                if (i === 0) {
                    value = fieldValue;
                } else {
                    value += ` ${fieldValue}`;
                }
            }
            return value;
        }
        return "Error: subfields not Set in array of objects context";
    },
});


Template.autoProfileField_object.helpers({
    fieldValueAsJSON() {
        return JSON.stringify(getFieldValue(Template.instance(), this.name ? this.name : this, this.id, null, this, this.namespace));
    }
});
