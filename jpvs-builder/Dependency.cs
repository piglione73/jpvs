using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace jpvs.Builder {

    class Dependency {
        public string Module { get; set; }
        public string[] Depends { get; set; }
        public string[] Classes { get; set; }



        /// <summary>
        /// Read all dependencies embedded in a javascript file.
        /// 
        /// Dependencies are embedded as follows.
        /// 
        /// /* JPVS
        /// Module: XXX
        /// Classes: Y, Z, W, ...
        /// Depends: A, B, C, ...
        /// */
        /// 
        /// This allows creating a dependency tree with all the modules and dependencies.
        /// </summary>
        /// <param name="jsFilePath"></param>
        /// <returns></returns>
        public static IEnumerable<Dependency> GetFromJS(string jsFilePath) {
            string curModuleName = Path.GetFileNameWithoutExtension(jsFilePath).ToLower();

            using (var file = new StreamReader(jsFilePath)) {
                bool inDepBlock = false;
                string moduleName = null;
                List<string> depends = null;
                List<string> classes = null;

                for (string line = file.ReadLine(); line != null; line = file.ReadLine()) {
                    line = line.Trim();

                    if (line.Equals("/* JPVS", StringComparison.InvariantCultureIgnoreCase)) {
                        inDepBlock = true;
                        moduleName = null;
                        depends = null;
                        classes = null;
                    }
                    else if (line == "*/" && inDepBlock) {
                        inDepBlock = false;
                        yield return new Dependency {
                            Module = moduleName,
                            Depends = depends != null ? depends.ToArray() : new string[0],
                            Classes = classes != null ? classes.ToArray() : new string[0]
                        };
                    }
                    else if (inDepBlock) {
                        //We are in a dependency block
                        if (line.StartsWith("Module:", StringComparison.InvariantCultureIgnoreCase)) {
                            moduleName = line.Substring("Module:".Length).Trim();
                        }
                        else if (line.StartsWith("Depends:", StringComparison.InvariantCultureIgnoreCase)) {
                            string modListStr = line.Substring("Depends:".Length).Trim();
                            depends = modListStr
                                .Split(',', ';')
                                .Select(x => x.Trim().ToLower())
                                .Where(x => x != null && x != "")
                                .ToList();
                        }
                        else if (line.StartsWith("Classes:", StringComparison.InvariantCultureIgnoreCase)) {
                            string clsListStr = line.Substring("Classes:".Length).Trim();
                            classes = clsListStr
                                .Split(',', ';')
                                .Select(x => x.Trim())
                                .Where(x => x != null && x != "")
                                .ToList();
                        }
                    }
                }
            }
        }
    }

}
