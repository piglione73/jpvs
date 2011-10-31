using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace jpvs.Builder {

    class DependsMap {
        public Dictionary<string, string> ClassToFile;
        public Dictionary<string, string> ClassToModule;
        public Dictionary<string, string[]> ModuleToDepends;


        public static DependsMap CreateFromListOfFiles(IEnumerable<string> jsFiles) {
            List<KeyValuePair<string, string>> c2f = new List<KeyValuePair<string, string>>();
            List<KeyValuePair<string, string>> c2m = new List<KeyValuePair<string, string>>();
            Dictionary<string, HashSet<string>> m2d = new Dictionary<string, HashSet<string>>();

            foreach (var jsFile in jsFiles) {
                var deps = Dependency.GetFromJS(jsFile);

                foreach (var dep in deps) {
                    //Class --> File
                    //Class --> Module
                    foreach (var cls in dep.Classes) {
                        c2f.Add(new KeyValuePair<string, string>(cls, Relativize(jsFile)));
                        c2m.Add(new KeyValuePair<string, string>(cls, dep.Module));
                    }

                    //Module --> Depends
                    if (m2d.ContainsKey(dep.Module)) {
                        var set = m2d[dep.Module];
                        foreach (string mod in dep.Depends)
                            set.Add(mod);
                    }
                    else
                        m2d[dep.Module] = new HashSet<string>(dep.Depends);
                }
            }

            DependsMap map = new DependsMap();
            map.ClassToFile = c2f.ToDictionary(x => x.Key, x => x.Value);
            map.ClassToModule = c2m.ToDictionary(x => x.Key, x => x.Value);
            map.ModuleToDepends = m2d.ToDictionary(x => x.Key, x => x.Value.ToArray());

            return map;
        }

        static string Relativize(string file) {
            return file;
        }
    }

}
