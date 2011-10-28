using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace jpvs.Builder {

    class Dependency {
        public string Class { get; set; }
        public string[] Modules { get; set; }



        /// <summary>
        /// Read all dependencies "Class --> Modules" embedded in a javascript file.
        /// 
        /// Dependencies are embedded as follows.
        /// 
        /// /* DEPENDENCY
        /// Class: XXX
        /// Modules: A, B, C, ...
        /// */
        /// 
        /// This allows creating a dependency tree with all the modules and class names.
        /// A module name is the javascript file without the ".js" extension.
        /// Example: module name "TextBox" is "TextBox.js", regardless of the file path.
        /// </summary>
        /// <param name="jsFilePath"></param>
        /// <returns></returns>
        public static IEnumerable<Dependency> GetFromJS(string jsFilePath) {
            string curModuleName = Path.GetFileNameWithoutExtension(jsFilePath).ToLower();

            using (var file = new StreamReader(jsFilePath)) {
                bool inDepBlock = false;
                string className = null;
                List<string> modules = null;

                for (string line = file.ReadLine(); line != null; line = file.ReadLine()) {
                    line = line.Trim();

                    if (line.Equals("/* DEPENDENCY", StringComparison.InvariantCultureIgnoreCase)) {
                        inDepBlock = true;
                        className = null;
                        modules = null;
                    }
                    else if (line == "*/") {
                        inDepBlock = false;
                        if (className != null && modules != null && modules.Count != 0)
                            yield return new Dependency {
                                Class = className,
                                Modules = modules.ToArray()
                            };
                    }
                    else if (inDepBlock) {
                        //We are in a dependency block
                        if (line.StartsWith("Class:", StringComparison.InvariantCultureIgnoreCase)) {
                            className = line.Substring(6).Trim();
                        }
                        else if (line.StartsWith("Modules:", StringComparison.InvariantCultureIgnoreCase)) {
                            string modListStr = line.Substring(8).Trim();
                            modules = modListStr
                                .Split(',', ';')
                                .Select(x => x.Trim().ToLower())
                                .ToList();
                        }
                    }
                }
            }
        }

    }

}
