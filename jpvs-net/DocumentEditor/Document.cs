using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JpvsNet.DocumentEditor {

    /// <summary>
    /// This class represents a Document, which is the object that can be edited in a jpvs.DocumentEditor javascript object.
    /// </summary>
    public class Document {
        /// <summary>
        /// Document sections
        /// </summary>
        public List<Section> sections = new List<Section>();

        /// <summary>
        /// Document fields, shared among all sections
        /// </summary>
        public Dictionary<string, Field> fields = new Dictionary<string, Field>();

        /// <summary>
        /// Margins
        /// </summary>
        public class BaseMargins {
            /// <summary>
            /// Default margin in cm (CSS-style: 2.5cm). Used when left/right/top/bottom are missing.
            /// </summary>
            public string all;

            /// <summary>
            /// Left margin in cm (CSS-style: 2.5cm)
            /// </summary>
            public string left;

            /// <summary>
            /// Right margin in cm (CSS-style: 2.5cm)
            /// </summary>
            public string right;
        }

        /// <summary>
        /// Section margins
        /// </summary>
        public class SectionMargins : BaseMargins {
            /// <summary>
            /// Top margin in cm (CSS-style: 2.5cm)
            /// </summary>
            public string top;

            /// <summary>
            /// Bottom margin in cm (CSS-style: 2.5cm)
            /// </summary>
            public string bottom;
        }

        /// <summary>
        /// Header margins
        /// </summary>
        public class HeaderMargins : BaseMargins {
            /// <summary>
            /// Top margin in cm (CSS-style: 2.5cm)
            /// </summary>
            public string top;
        }

        /// <summary>
        /// Footer margins
        /// </summary>
        public class FooterMargins : BaseMargins {
            /// <summary>
            /// Bottom margin in cm (CSS-style: 2.5cm)
            /// </summary>
            public string bottom;
        }

        /// <summary>
        /// Section of a document
        /// </summary>
        public class Section {
            /// <summary>
            /// Custom data that may be used to store application-specific information related to this section
            /// </summary>
            public string customData;

            /// <summary>
            /// Margins of the current section
            /// </summary>
            public SectionMargins margins = new SectionMargins();

            /// <summary>
            /// Section header
            /// </summary>
            public Header header = new Header();

            /// <summary>
            /// Section footer
            /// </summary>
            public Footer footer = new Footer();

            /// <summary>
            /// Section body
            /// </summary>
            public Body body = new Body();
        }

        /// <summary>
        /// Header of a document
        /// </summary>
        public class Header : Body {
            /// <summary>
            /// Header margins
            /// </summary>
            public HeaderMargins margins = new HeaderMargins();

            /// <summary>
            /// Header height in cm (CSS-style: 1cm)
            /// </summary>
            public string height;
        }

        /// <summary>
        /// Footer of a document
        /// </summary>
        public class Footer : Body {
            /// <summary>
            /// Footer margins
            /// </summary>
            public FooterMargins margins = new FooterMargins();

            /// <summary>
            /// Footer height in cm (CSS-style: 1cm)
            /// </summary>
            public string height;
        }

        /// <summary>
        /// Document body
        /// </summary>
        public class Body {
            /// <summary>
            /// Content in (X)HTML format
            /// </summary>
            public string content;

            /// <summary>
            /// If true, the content will be briefly highlighted when rendered into the browser
            /// </summary>
            public bool highlight;
        }

        /// <summary>
        /// Document field
        /// </summary>
        public class Field {
            /// <summary>
            /// Field value
            /// </summary>
            public string value;

            /// <summary>
            /// If true, the field will be briefly highlighted when rendered into the browser
            /// </summary>
            public bool highlight;
        }
    }

}
