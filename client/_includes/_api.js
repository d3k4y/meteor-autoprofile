/* eslint-disable consistent-return,default-case,no-case-declarations */
import moment from "moment/moment";
import {SimpleSchemaGroup} from "simpl-schema";
import {_} from "meteor/erasaur:meteor-lodash";

import {SimpleSchemaFunctions} from "meteor/d3k4y:meteor-simple-schema-functions";
import {Blaze} from "meteor/blaze";
import {Template} from "meteor/templating";


export function dbg(...params) {
    // console.error.apply(this, params);
}

export function getCollectionByName(collectionName) {
    return typeof window !== 'undefined' ? window[collectionName] : global[collectionName];
}

export function getTemplateFromView(view) {
    if (view._templateInstance) {
        return view._templateInstance;
    }
    if (view.parentView) {
        return getTemplateFromView(view.parentView);
    }
    return null;
}

export function getAutoprofileTemplate(templateInstance) {
    if (!templateInstance) { return undefined; }
    if (templateInstance.parentView) {
        templateInstance = getTemplateFromView(templateInstance)
    }
    if (templateInstance.view) {
        if (templateInstance.view.name === 'Template.autoProfile') { return templateInstance; }
    }
    return templateInstance.parent(instance => instance.view.name === 'Template.autoProfile');
}

export function getData (templateInstance) {
    const autoProfileTemplate = getAutoprofileTemplate(templateInstance);
    if (autoProfileTemplate) {
        return autoProfileTemplate.data;
    }
}

export function getOptions (templateInstance) {
    const data = getData(templateInstance);
    if (data) {
        return data.options;
    }
}
export function getContext (templateInstance) {
    const data = getData(templateInstance);
    if (data) {
        return data.myContext;
    }
}

export function unifyNamespace (namespace) {
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

export function getNamespaceContext (context, namespace) {
    if (context) {
        const ns = unifyNamespace(namespace);
        if (ns.length > 0) {
            return context[ns[0]];
        }
    }
    return context;
}

export function getFieldValue (templateInstance, id, context, options) {
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
                    return value;
                } else if (fieldSchema.type.singleType === String && afFieldInput && (afFieldInput.type === "fileUpload" || afFieldInput.type === 'meteorAutoformUpload')) {
                    const collection = getCollectionByName(afFieldInput.collection);
                    if (collection) {
                        const file = collection.find({_id: value}).fetch();
                        if (file && file.length > 0) {
                            return file[0];
                        }
                        return false;
                    }
                } else if (fieldSchema.type.singleType === Array) {
                    if (afFieldInput) {
                        const collection = getCollectionByName(afFieldInput.collection);
                        if (collection && value) {
                            if (context.type === 'autoProfileField_image') {
                                const file = collection.find({_id: value[0]}).fetch();
                                if (file && file.length > 0) {
                                    return file[0];
                                }
                            } else {
                                return value;
                            }
                            return false;
                        }
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

export function getTemplate (templateInstance, context) {
    const profileOptions = getOptions(templateInstance);
    const fullName = context.namespace ? `${context.namespace}.${context.id || context.name}` : context.id || context.name;
    if (context.type || context.template) { return context.type || context.template; }
    const foreignCollection = getCollectionByName(_.get(context, 'reference.collectionName'));
    const fullNameSplit = fullName ? fullName.split('.') : [];
    const fieldSchema =
        SimpleSchemaFunctions.getFieldSchema(foreignCollection || profileOptions.collection, fullName) ||
        SimpleSchemaFunctions.getFieldSchema(foreignCollection || profileOptions.collection, context.id);
    if (fieldSchema) {
        switch (fieldSchema.type.singleType) {
            case Object: return "autoProfileField_object";
            case Number: return "autoProfileField_string";
            case Date: return "autoProfileField_date";
            case String:
                const autoform = fieldSchema.autoform;
                if (context.reference) {
                    return context.reference.reverse ? "autoProfileField_array_object" : "autoProfileField_string_reference";
                }
                if (autoform) {
                    if (autoform.rows > 0 || autoform.type === "markdown") {
                        return "autoProfileField_string_textarea";
                    }
                    const afFieldInput = autoform.afFieldInput;
                    if (afFieldInput) {
                        switch (afFieldInput.type) {
                            case 'fileUpload':
                            case 'meteorAutoformUpload':
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
                const rootFieldName = fullNameSplit.length > 1 && fullName.indexOf('$') > -1 ? fullNameSplit[0] : fullName;
                const subSchema = SimpleSchemaFunctions.getFieldSchema(foreignCollection || profileOptions.collection, `${rootFieldName}.$`);
                if (subSchema) {
                    switch (subSchema.type.singleType) {
                        case SimpleSchemaGroup:
                        case Object: return "autoProfileField_array_object";
                        case String: return "autoProfileField_array";
                        default: if (typeof subSchema.type.singleType === 'object') { return "autoProfileField_array_object"; }
                    }
                }
                return "autoProfileField_array";
        }
    } else {
        dbg('getTemplate: fieldSchema not found!', fullName, context.id);
    }
    return "autoProfileField_string";
}

export function getHiddenClass(templateInstance) {
    const options = getOptions(templateInstance);
    return options && options.hiddenClass ? options.hiddenClass : 'd-none';
}

function getOptionsByDomElem(elem) {
    const view = Blaze.getView(elem);
    const parentTemplate = _.get(view, '_templateInstance') ? _.get(view, '_templateInstance') : _.get(view, 'parentView._templateInstance');
    if(parentTemplate) {
        const autoprofileTemplate = parentTemplate.parent((instance) => { return instance.view.name === 'Template.autoProfile'; });
        if (autoprofileTemplate) {
            return _.get(autoprofileTemplate, 'data.options');
        }
    }
}

export function disableInplaceEditing($autoprofileField, quickformView, hiddenClass) {
    const $field = $autoprofileField.find('.autoprofile-field');
    $field.removeClass(hiddenClass);
    Blaze.remove(quickformView);
}

export function disableInplaceEditingByContextTemplate(template) {
    const quickformTemplate = template.parent((instance) => { return instance.view.name === 'Template.quickForm'; });
    if (quickformTemplate) {
        const $parent = $(template.firstNode.parentNode);
        const field = $parent.find('.autoprofile-field');
        const options = getOptionsByDomElem(field[0]);
        if (options) {
            field.removeClass(options.hiddenClass);
            Blaze.remove(quickformTemplate.view);
        }
    }
}

export function getTooltipValue(templateInstance, searchTerm) {
    const tooltip = templateInstance.data.tooltip;
    if(tooltip && typeof tooltip.render === 'function') {
        return tooltip.render(searchTerm, templateInstance);
    }
}

export function getTooltipDirection(templateInstance) {
    const tooltip = templateInstance.data.tooltip;
    return tooltip ? tooltip.direction : null;
}

export function getTooltipClasses(templateInstance) {
    const tooltip = templateInstance.data.tooltip;
    return tooltip ? tooltip.classes : null;
}

export function handleMouseoutEvent(event) {
    const $toElement = $(event.toElement);
    if ($toElement.hasClass('tooltip') || $toElement.closest('.tooltip')[0]) {
        event.stopPropagation();
        $toElement.on('mouseleave', (event) => {
            Tooltips.hide();
        });
    }
}
