using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Web.Script.Serialization;

namespace jpvs.Builder {

    class DependsMap {
        public Dictionary<string, string> ClassToFile;
        public Dictionary<string, string> ClassToModule;
        public Dictionary<string, string[]> ModuleToDepends;
        public Dictionary<string, string[]> ModuleToFiles;

        public override string ToString() {
            var jss = new JavaScriptSerializer();
            return jss.Serialize(this);
        }

        public static DependsMap CreateFromListOfFiles(IEnumerable<string> jsFiles) {
            List<KeyValuePair<string, string>> c2f = new List<KeyValuePair<string, string>>();
            List<KeyValuePair<string, string>> c2m = new List<KeyValuePair<string, string>>();
            Dictionary<string, HashSet<string>> m2d = new Dictionary<string, HashSet<string>>();
            Dictionary<string, HashSet<string>> m2f = new Dictionary<string, HashSet<string>>();

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
                    //Module --> File
                    if (m2d.ContainsKey(dep.Module)) {
                        var set = m2d[dep.Module];
                        foreach (string mod in dep.Depends)
                            set.Add(mod);
                    }
                    else
                        m2d[dep.Module] = new HashSet<string>(dep.Depends);

                    if (m2f.ContainsKey(dep.Module)) {
                        var set = m2f[dep.Module];
                        set.Add(Relativize(jsFile));
                    }
                    else
                        m2f[dep.Module] = new HashSet<string>(new string[] { Relativize(jsFile) });
                }
            }

            DependsMap map = new DependsMap();
            map.ClassToFile = c2f.ToDictionary(x => x.Key, x => x.Value);
            map.ClassToModule = c2m.ToDictionary(x => x.Key, x => x.Value);
            map.ModuleToDepends = m2d.ToDictionary(x => x.Key, x => x.Value.ToArray());
            map.ModuleToFiles = m2f.ToDictionary(x => x.Key, x => x.Value.ToArray());

            return map;
        }

        static string baseJsPath = Path.GetFullPath(Utils.GetJPVSDirectory("javascript/src")).ToLower();

        static string Relativize(string file) {
            if (Path.GetFullPath(file).ToLower().StartsWith(baseJsPath))
                return file.Substring(baseJsPath.Length + 1).Replace('\\', '/');
            else
                return file.Replace('\\', '/');
        }
    }

}
