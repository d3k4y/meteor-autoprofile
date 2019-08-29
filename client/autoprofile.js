import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {_} from "meteor/erasaur:meteor-lodash";

import './_includes/autoformHooks';
import {getContext, getHiddenClass} from './_includes/_api';

import './autoprofile.html';
import './_includes/panel.html';
import './_includes/panel.js';
import './_includes/helperEditable.html';
import './_includes/helperEditable.js';

import './_includes/fieldTypes/stringReference.html';
import './_includes/fieldTypes/stringReference.js';
import './_includes/fieldTypes/fileReference.html';
import './_includes/fieldTypes/string.html';
import './_includes/fieldTypes/string.js';
import './_includes/fieldTypes/stringTextarea.html';
import './_includes/fieldTypes/image.html';
import './_includes/fieldTypes/file.html';
import './_includes/fieldTypes/fileCheck.html';
import './_includes/fieldTypes/fileCheck.js';
import './_includes/fieldTypes/fileCheckArray.html';
import './_includes/fieldTypes/fileCheckArray.js';
import './_includes/fieldTypes/date.html';
import './_includes/fieldTypes/object.html';
import './_includes/fieldTypes/object.js';
import './_includes/fieldTypes/array.html';
import './_includes/fieldTypes/arrayObject.html';
import './_includes/fieldTypes/arrayObject.js';
import './autoprofile.css';


Template.autoProfile.onCreated(function onRendered() {
    window.autoprofileState_HiddenClass = new ReactiveVar(_.get(this.data, 'options.hiddenClass') || 'd-none');
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
    getEditButtonClass() {
        return `btn btn-primary cf-button-primary js-edit-field-afmodalbutton ${getHiddenClass(Template.instance())}`;
    },
    getAddArrayItemButtonClass() {
        return `btn btn-primary cf-button-primary js-add-array-item-afmodalbutton ${getHiddenClass(Template.instance())}`;
    },
    getCreateReferenceDocAndAddArrayItemButtonClass() {
        return `btn btn-primary cf-button-primary js-create-reference-doc-and-add-array-item-afmodalbutton ${getHiddenClass(Template.instance())}`;
    },

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
    getMeteorUpdateMethod() {
        if (Template.instance().currentMethod.get() || Template.instance().data.options.method) {
            return "enhancedmethod";
        }
        return null;
    },
    getDocId() {
        const context = getContext(Template.instance());
        return Template.instance().currentDocumentId.get() || context ? context._id : null;
    },
    getCollectionName() {
        return Template.instance().currentCollectionName.get() || Template.instance().data.options.collectionName;
    },
    getCollection() {
        return Freelancers;
    },
    getInstance() {
        return Template.instance();
    },
    getEditFormId() {
        const options = Template.instance().data.options;
        return options.updateType === 'updateSet' ? 'AutoProfileEditForm_UpdateSet' : 'AutoProfileEditForm_UpdateDoc';
    },
    getAutoprofileTemplate() {
        const options = Template.instance().data.options;
        return options.autoprofileTemplate || 'bootstrap4';
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

Template.autoProfileField_string_reference.inheritsEventsFrom('autoProfileField_string');