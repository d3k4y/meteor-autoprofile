/* eslint-disable meteor/template-names,consistent-return */
import {Template} from "meteor/templating";
import {_} from "meteor/erasaur:meteor-lodash";

import {getFieldValue, getCollectionByName} from "../_api";


function getRelatedDocument(ref, refId) {
    if (refId && ref && ref.collection || ref.collectionName) {
        const collection = ref.collection || getCollectionByName(ref.collectionName);
        if (collection) {
            const referencedField = _.get(ref, 'referencedField');
            let relObj = null;
            if (referencedField) {
                const selector = {};
                selector[referencedField] = refId;
                relObj = collection.findOne(selector)
            } else {
                relObj = collection.findOne(refId)
            }
            return relObj;
        }
    }
}


/* Extend Field: String ID Reference to different Collection */
Template.autoProfileField_string_reference.helpers({
    referenceUrl() {
        const ref = this.reference;
        const refId = getFieldValue(Template.instance(), this.id || this, this);
        const relDoc = getRelatedDocument(ref, refId);
        if(relDoc && ref.urlSuffixField) {
            return ref.urlPrefix + relDoc[ref.urlSuffixField];
        }
        return ref.urlPrefix + refId;
    },
    referenceLabel() {
        const ref = this.reference;
        const refId = getFieldValue(Template.instance(), this.id || this, this);
        const relDoc = getRelatedDocument(ref, refId);
        if(relDoc) {
            return relDoc[ref.labelField && (ref.labelField.id || ref.labelField)];
        }
    },
});