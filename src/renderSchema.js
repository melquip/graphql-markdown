/* eslint-disable valid-typeof */
'use strict'
function sortBy(arr, property) {
  arr.sort((a, b) => {
    const aValue = a[property]
    const bValue = b[property]
    if (aValue > bValue) return 1
    if (bValue > aValue) return -1
    return 0
  })
}

function renderType(type, options) {
  if (type.kind === 'NON_NULL') {
    return renderType(type.ofType, options) + '!'
  }
  if (type.kind === 'LIST') {
    return `[${renderType(type.ofType, options)}]`
  }
  const url = options.getTypeURL(type)
  return url ? `<a href="${url}">${type.name}</a>` : type.name
}

function renderSchema(schema, options) {
  options = options || {}
  const title = options.title || 'Schema Types'
  const skipTitle = options.skipTitle || false
  const skipTableOfContents = options.skipTableOfContents || false
  const prologue = options.prologue || ''
  const epilogue = options.epilogue || ''
  const printer = options.printer || console.log
  const headingLevel = options.headingLevel || 1
  const unknownTypeURL = options.unknownTypeURL
  const genQuery = options.genQuery
  const argTypes = options.argTypes ? options.argTypes : true
  const outTypes = options.outTypes ? options.outTypes : false
  const allQueries = {}

  if (schema.__schema) {
    schema = schema.__schema
  }

  const types = schema.types.filter(type => !type.name.startsWith('__'))
  const typeMap = schema.types.reduce((typeMap, type) => {
    return Object.assign(typeMap, { [type.name]: type })
  }, {})
  const getTypeURL = type => {
    const url = `#${type.name.toLowerCase()}`
    if (typeMap[type.name]) {
      return url
    } else if (typeof unknownTypeURL === 'function') {
      return unknownTypeURL(type)
    } else if (unknownTypeURL) {
      return unknownTypeURL + url
    }
  }

  const queryType = schema.queryType
  const query =
    queryType && types.find(type => type.name === schema.queryType.name)
  const mutationType = schema.mutationType
  const mutation =
    mutationType && types.find(type => type.name === schema.mutationType.name)
  const objects = types.filter(
    type => type.kind === 'OBJECT' && type !== query && type !== mutation
  )
  const inputs = types.filter(type => type.kind === 'INPUT_OBJECT')
  const enums = types.filter(type => type.kind === 'ENUM')
  const scalars = types.filter(type => type.kind === 'SCALAR')
  const interfaces = types.filter(type => type.kind === 'INTERFACE')

  sortBy(objects, 'name')
  sortBy(inputs, 'name')
  sortBy(enums, 'name')
  sortBy(scalars, 'name')
  sortBy(interfaces, 'name')

  if (!skipTitle) {
    printer(`${'#'.repeat(headingLevel)} ${title}\n`)
  }

  if (prologue) {
    printer(`${prologue}\n`)
  }

  if (!skipTableOfContents) {
    printer('<details>')
    printer('  <summary><strong>Table of Contents</strong></summary>\n')
    if (query) {
      printer('  * [Query](#query)')
    }
    if (mutation) {
      printer('  * [Mutation](#mutation)')
    }
    if (objects.length) {
      printer('  * [Objects](#objects)')
      objects.forEach(type => {
        printer(`    * [${type.name}](#${type.name.toLowerCase()})`)
      })
    }
    if (inputs.length) {
      printer('  * [Inputs](#inputs)')
      inputs.forEach(type => {
        printer(`    * [${type.name}](#${type.name.toLowerCase()})`)
      })
    }
    if (enums.length) {
      printer('  * [Enums](#enums)')
      enums.forEach(type => {
        printer(`    * [${type.name}](#${type.name.toLowerCase()})`)
      })
    }
    if (scalars.length) {
      printer('  * [Scalars](#scalars)')
      scalars.forEach(type => {
        printer(`    * [${type.name}](#${type.name.toLowerCase()})`)
      })
    }
    if (interfaces.length) {
      printer('  * [Interfaces](#interfaces)')
      interfaces.forEach(type => {
        printer(`    * [${type.name}](#${type.name.toLowerCase()})`)
      })
    }
    printer('\n</details>')
  }

  if (query) {
    printer(
      `\n${'#'.repeat(headingLevel + 1)} Query${
        query.name === 'Query' ? '' : ' (' + query.name + ')'
      }`
    )
    renderObject(query, {
      skipTitle: true,
      headingLevel,
      printer,
      getTypeURL,
      genQuery,
      argTypes,
      outTypes
    })
  }

  if (mutation) {
    printer(
      `\n${'#'.repeat(headingLevel + 1)} Mutation${
        mutation.name === 'Mutation' ? '' : ' (' + mutation.name + ')'
      }`
    )
    renderObject(mutation, {
      skipTitle: true,
      headingLevel,
      printer,
      getTypeURL,
      genQuery,
      argTypes,
      outTypes
    })
  }

  if (objects.length) {
    printer(`\n${'#'.repeat(headingLevel + 1)} Objects`)
    objects.forEach(type =>
      renderObject(type, { headingLevel, printer, getTypeURL })
    )
  }

  if (inputs.length) {
    printer(`\n${'#'.repeat(headingLevel + 1)} Inputs`)
    inputs.forEach(type =>
      renderObject(type, { headingLevel, printer, getTypeURL })
    )
  }

  if (enums.length) {
    printer(`\n${'#'.repeat(headingLevel + 1)} Enums`)
    enums.forEach(type => {
      printer(`\n${'#'.repeat(headingLevel + 2)} ${type.name}\n`)
      if (type.description) {
        printer(`${type.description}\n`)
      }
      printer('<table>')
      printer('<thead>')
      printer('<th align="left">Value</th>')
      printer('<th align="left">Description</th>')
      printer('</thead>')
      printer('<tbody>')
      type.enumValues.forEach(value => {
        printer('<tr>')
        printer(
          `<td valign="top"><strong>${value.name}</strong>${
            value.isDeprecated ? ' ⚠️' : ''
          }</td>`
        )
        if (value.description || value.isDeprecated) {
          printer('<td>')
          if (value.description) {
            printer(`\n${value.description}\n`)
          }
          if (value.isDeprecated) {
            printer('<p>⚠️ <strong>DEPRECATED</strong></p>')
            if (value.deprecationReason) {
              printer('<blockquote>')
              printer(`\n${value.deprecationReason}\n`)
              printer('</blockquote>')
            }
          }
          printer('</td>')
        } else {
          printer('<td></td>')
        }
        printer('</tr>')
      })
      printer('</tbody>')
      printer('</table>')
    })
  }

  if (scalars.length) {
    printer(`\n${'#'.repeat(headingLevel + 1)} Scalars\n`)
    scalars.forEach(type => {
      printer(`${'#'.repeat(headingLevel + 2)} ${type.name}\n`)
      if (type.description) {
        printer(`${type.description}\n`)
      }
    })
  }

  if (interfaces.length) {
    printer(`\n${'#'.repeat(headingLevel + 1)} Interfaces\n`)
    interfaces.forEach(type =>
      renderObject(type, { headingLevel, printer, getTypeURL })
    )
  }

  if (epilogue) {
    printer(`\n${epilogue}`)
  }

  function renderObject(type, options) {
    options = options || {}
    const skipTitle = options.skipTitle === true
    const printer = options.printer || console.log
    const headingLevel = options.headingLevel || 1
    const getTypeURL = options.getTypeURL
    const isInputObject = type.kind === 'INPUT_OBJECT'
    const isQuery = type.name === 'Query'
    const isMutation = type.name === 'Mutation'
    const genQuery = options.genQuery && (isQuery || isMutation)
    const argTypes = options.argTypes
    const outTypes = options.outTypes
    if (!skipTitle) {
      printer(`\n${'#'.repeat(headingLevel + 2)} ${type.name}\n`)
    }
    if (type.description) {
      printer(`${type.description}\n`)
    }
    printer('<table>')
    printer('<thead>')
    printer('<tr>')
    if (isInputObject) {
      printer('<th colspan="2" align="left">Field</th>')
    } else {
      printer('<th align="left">Field</th>')
      printer('<th align="right">Argument</th>')
    }
    printer('<th align="left">Type</th>')
    printer('<th align="left">Description</th>')
    printer('</tr>')
    printer('</thead>')
    printer('<tbody>')

    const fields = isInputObject ? type.inputFields : type.fields
    fields.forEach(field => {
      printer('<tr>')
      printer(
        `<td colspan="2" valign="top"><strong>${field.name}</strong>${
          field.isDeprecated ? ' ⚠️' : ''
        }</td>`
      )
      printer(`<td valign="top">${renderType(field.type, { getTypeURL })}</td>`)
      if (field.description || field.isDeprecated || genQuery) {
        printer('<td>')
        if (field.description) {
          printer(`\n${field.description}\n`)
        }
        if (genQuery) {
          const isRequired = kind => `${kind === 'NON_NULL' ? '!' : ''}`
          const objData = (
            objType,
            showTypes = false,
            level = 2,
            outputValidation = false
          ) => {
            const name = objType.ofType ? objType.ofType.name : objType.name
            const typeFields = name
              ? typeMap[name].fields
                ? typeMap[name].fields
                : typeMap[name].inputFields
                ? typeMap[name].inputFields
                : []
              : []
            const isInput = name ? !!typeMap[name].inputFields : false
            const isObject = objType.ofType && objType.ofType.kind === 'OBJECT'
            const getTypeof = (fType, ignoreObject = false) => {
              const { kind, name, ofType } = fType || {}
              const { kind: ofKind, name: ofName, ofType: ofOfType } =
                ofType || {}
              return !isObject || ignoreObject
                ? showTypes
                  ? `: ${ofType && ofKind === 'LIST' ? '[' : ''}${
                      ofType
                        ? ofKind === 'LIST'
                          ? ofOfType.ofType.name
                          : ofName
                        : kind === 'INPUT_OBJECT'
                        ? objData(fType, true, level + 1, outputValidation)
                        : name
                    }${
                      ofType && ofKind === 'LIST'
                        ? `${isRequired(ofOfType.kind)}]`
                        : ''
                    }${isRequired(kind)}`
                  : ''
                : `${
                    kind === 'OBJECT'
                      ? ` {\n${objData(
                          fType,
                          showTypes,
                          level + 1,
                          outputValidation
                        )}\n${'  '.repeat(level)}}`
                      : showTypes
                      ? `${getTypeof(
                          kind === 'LIST'
                            ? {
                                kind,
                                name,
                                ofType: fType
                              }
                            : fType,
                          true
                        )}`
                      : ''
                  }`
            }
            if (!outputValidation) {
              return `${isInput ? `{\n` : ''}${typeFields
                .map(f => `${'  '.repeat(level)}${f.name}${getTypeof(f.type)}`)
                .join('\n')}${isInput ? `\n${'  '.repeat(level - 1)}}` : ''}`
            } else {
              return typeFields.map(f => {
                let type = getTypeof(f.type)
                if (f.type.kind === 'INPUT_OBJECT') {
                  type = objData(f.type, true, level + 1, outputValidation)
                } else {
                  type = type.replace(/(: |\[|\]|!)/gm, '').toLowerCase()
                  type = type === 'float' ? 'number' : type
                }
                const isArray = f.type.ofType
                  ? f.type.ofType.kind === 'LIST'
                  : false
                return {
                  name: f.name,
                  type,
                  isArray,
                  isArrayRequired: isArray ? f.type.kind === 'NON_NULL' : false,
                  required:
                    (isArray ? f.type.ofType.ofType.kind : f.type.kind) ===
                    'NON_NULL'
                }
              })
            }
          }

          const qArgs = `${field.args
            .map(
              arg =>
                `${arg.name}: ${
                  arg.type.ofType.kind === 'INPUT_OBJECT'
                    ? `${objData(arg.type, argTypes)}`
                    : `${arg.type.ofType.name + isRequired(arg.type.kind)}`
                }`
            )
            .join(', ')}`
          const qOutput = `${objData(field.type, outTypes)}`
          const finalQuery = `\n\`\`\`\n${type.name.toLowerCase()} {
  ${field.name} ${qArgs ? `(${qArgs})` : ''} ${
            qOutput ? `{\n${qOutput}\n  }` : ''
          }
}\n\`\`\`\n\n`
          printer(finalQuery)

          allQueries[field.name] = data => {
            const queryArgs = field.args.map(arg => {
              const type =
                arg.type.ofType.kind === 'INPUT_OBJECT'
                  ? objData(arg.type, true, 2, true)
                  : arg.type.ofType.name.toLowerCase()
              const isArray = arg.type.ofType
                ? arg.type.ofType.kind === 'LIST'
                : false
              return {
                name: arg.name,
                type,
                isArray,
                isArrayRequired: isArray ? arg.type.kind === 'NON_NULL' : false,
                required:
                  (isArray ? arg.type.ofType.ofType.kind : arg.type.kind) ===
                  'NON_NULL'
              }
            })
            let qArgs = ''
            // validation
            const validateData = (qArg, data) => {
              const argInData = qArg.name in data
              const isRequiredArg =
                qArg.required || (qArg.isArray && qArg.isArrayRequired)
              if (!argInData && isRequiredArg) {
                return console.error(
                  `\nQuery missing required parameter "${qArg.name}"!`
                )
              }
              if (argInData) {
                if (typeof qArg.type === 'string') {
                  if (typeof data[qArg.name] !== qArg.type) {
                    return console.error(
                      `Argument "${qArg.name}" should be of type "${qArg.type}".`
                    )
                  }
                } else {
                  console.log('recurse', qArg, data[qArg.name])
                  for (const qSubArg of qArg.type) {
                    validateData(qSubArg, data[qArg.name])
                  }
                  console.log('\n\nreturned from recurse\n')
                }
              }
            }
            for (const qArg of queryArgs) {
              validateData(qArg, data)
            }

            return `\n\`\`\`\n${type.name.toLowerCase()} {
  ${field.name} ${qArgs ? `(${qArgs})` : ''} ${
              qOutput ? `{\n${qOutput}\n  }` : ''
            }
}\n\`\`\`\n\n`
          }
          allQueries[field.name]({
            data: {}
          })
        }
        if (field.isDeprecated) {
          printer('<p>⚠️ <strong>DEPRECATED</strong></p>')
          if (field.deprecationReason) {
            printer('<blockquote>')
            printer(`\n${field.deprecationReason}\n`)
            printer('</blockquote>')
          }
        }
        printer('</td>')
      } else {
        printer('<td></td>')
      }
      printer('</tr>')
      if (!isInputObject && field.args.length) {
        field.args.forEach((arg, i) => {
          printer('<tr>')
          printer(`<td colspan="2" align="right" valign="top">${arg.name}</td>`)
          printer(
            `<td valign="top">${renderType(arg.type, { getTypeURL })}</td>`
          )
          if (arg.description) {
            printer('<td>')
            printer(`\n${arg.description}\n`)
            printer('</td>')
          } else {
            printer(`<td></td>`)
          }
          printer('</tr>')
        })
      }
    })
    printer('</tbody>')
    printer('</table>')
  }

  return allQueries
}

module.exports = renderSchema
