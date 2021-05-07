```
  import 'package:shared_preferences/shared_preferences.dart';
  
  static Object setSharedPerfence(String key, Object value) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    if (value is int) {
      await prefs.setInt(key, value);
    } else if (value is double) {
      await prefs.setDouble(key, value);
    } else if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    } else if (value is List) {
      await prefs.setStringList(key, value);
    } else {
      throw new Exception("不能得到这种类型");
    }
  }

  static Future getSharedPerfence(String key, Object defaultValue) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    if (defaultValue is int) {
      return prefs.getInt(key) ?? defaultValue;
    } else if (defaultValue is double) {
      return prefs.getDouble(key) ?? defaultValue;
    } else if (defaultValue is bool) {
      return prefs.getBool(key) ?? defaultValue;
    } else if (defaultValue is String) {
      return prefs.getString(key) ?? defaultValue;
    } else if (defaultValue is List) {
      return prefs.getStringList(key) ?? defaultValue;
    } else {
      throw new Exception("不能得到这种类型");
    }
  }

  static void remove(String key) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    prefs.remove(key); //删除指定键
  }

  static void clear() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    prefs.clear(); ////清空缓存
  }
```
