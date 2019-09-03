/* eslint-disable meteor/template-names */
import {Template} from "meteor/templating";
import {_} from "meteor/erasaur:meteor-lodash";

import {getFieldValue, getTemplate, getOptions} from "../_api";


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
                if (i === 0) value = '';
                else value += ' ';
                if (templateName === "autoProfileField_array_object" && subfield.isFileField) {
                    const fileCursor = subfield.fileCursor ? subfield.fileCursor(fieldValue) : null;
                    if (fileCursor) {
                        value += `<span data-field-id="${subfield.id}"><a href="${fileCursor.link()}" target="_blank">${fileCursor.name}</a></span>`;
                    }
                } else  if (templateName === "autoProfileField_file") {
                    const href = `/cdn/storage/${fieldValue._collectionName}/${fieldValue._id}/original/${fieldValue._id}.${fieldValue.extension}`;
                    return `<a href="${href}" target="_blank">${fieldValue.name}</a>`;
                }
                else if (subfield && subfield.link) {
                    value += `<a href="${fieldValue}" target="_blank">${fieldValue}</a>`;
                }
                else if (reference && reference.reverse) {
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