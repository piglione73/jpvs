using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JpvsNet.DocumentEditor {

    /// <summary>
    /// This class represents a list of Document's, grouped in a single object. It is possible to use the GetPart or the GetAllParts 
    /// method to get a Document object, which is editable in a jpvs.DocumentEditor.
    /// </summary>
    public class MultiPartDocument {
        /// <summary>
        /// List of document parts. Each part is a Document.
        /// </summary>
        public List<Document> parts = new List<Document>();

        /// <summary>
        /// MultiPartDocument fields, shared among all parts
        /// </summary>
        public Dictionary<string, Document.Field> fields = new Dictionary<string, Document.Field>();

        /// <summary>
        /// Returns a Document that represents a single part of this MultiPartDocument, given the part index.
        /// </summary>
        /// <param name="index">The index of the part that is to be converted to a plain Document.</param>
        /// <returns></returns>
        public Document GetPart(int index) {
            return new Document {
                sections = parts[index].sections,
                fields = fields
            };
        }

        /// <summary>
        /// Returns a Document that represents the entire MultiPartDocument, flattened.
        /// An attempt is made to extract all field values from the MultiPartDocument and from all the parts.
        /// </summary>
        /// <returns></returns>
        public Document GetAllParts() {
            return new Document {
                sections = parts.SelectMany(part => part.sections).ToList(),
                fields = parts
                            .SelectMany(part => part.fields)
                            .Concat(fields)
                            .GroupBy(fieldKeyValue => fieldKeyValue.Key, fieldKeyValue => fieldKeyValue.Value)
                            .ToDictionary(group => group.Key, group => group.Last())
            };
        }

    }

}
