# 集成 AWS 身份验证

## 场景

项目部署于亚马逊服务器，要求集成亚马逊的身份验证

> 参考： https://qiita.com/daikiojm/items/b02c19cfea6766c308ca

## START

### NPM

> npm i aws-sdk amazon-cognito-identity-js -S

### CONFIG

```javascript
// @/config/cognito.js
export default {
  Region: "ap-northeast-1", // region
  UserPoolId: "ap-northeast-1_xxxxxxxxx", // 用户池ID
  ClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx", // 客户端ID
  IdentityPoolId: "ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // 身份池ID
};
```

## CODE

定义 Cognito 类

```javascript
// @/utils/cognito.js
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { Config, CognitoIdentityCredentials } from "aws-sdk";
import Vue from "vue";
import config from "@/config/cognito";

class Cognito {
  configure(config) {
    if (config.userPool) {
      this.userPool = config.userPool;
    } else {
      this.userPool = new CognitoUserPool({
        UserPoolId: config.UserPoolId,
        ClientId: config.ClientId,
      });
    }
    としてUserAttributeにも登録;
    Config.region = config.region;
    Config.credentials = new CognitoIdentityCredentials({
      IdentityPoolId: config.IdentityPoolId,
    });
    this.options = config;
  }

  static install = (Vue, options) => {
    Object.defineProperty(Vue.prototype, "$cognito", {
      get() {
        return this.$root._cognito;
      },
    });

    Vue.mixin({
      beforeCreate() {
        if (this.$options.cognito) {
          this._cognito = this.$options.cognito;
          this._cognito.configure(options);
        }
      },
    });
  };

  /**
   * 代码有效性验证
   */
  confirmation(username, confirmationCode) {
    const userData = { Username: username, Pool: this.userPool };
    const cognitoUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 注册
   * 使用邮箱
   */
  signUp(username, password) {
    const dataEmail = { Name: "email", Value: username };
    const attributeList = [];
    attributeList.push(new CognitoUserAttribute(dataEmail));
    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        username,
        password,
        attributeList,
        null,
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }
  /**
   * 登录
   */
  login(username, password) {
    const userData = { Username: username, Pool: this.userPool };
    const cognitoUser = new CognitoUser(userData);
    const authenticationData = { Username: username, Password: password };
    const authenticationDetails = new AuthenticationDetails(authenticationData);
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          // 実際にはクレデンシャルなどをここで取得する(今回は省略)
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },,
        mfaRequired: function (codeDeliveryDetails) {
          // MFA is required to complete user authentication.
          // Get the code from user and call
        },
        // 非管理员身份，或其他用户初次登录时可能会被验证拦截，需要修改密码，此处手动调用后静默处理
        newPasswordRequired: function (userAttributes, requiredAttributes) {
          cognitoUser.completeNewPasswordChallenge(password, {}, this)
        }
      });
    });
  }

  /**
   * 退出登录
   */
  logout() {
    this.userPool.getCurrentUser().signOut();
  }

  // 忘记密码
  forgotPassword(username) {
    console.log("Forgot Password", username);
    const userData = {
      Username: username,
      Pool: this.userPool,
    };

    const cognitoUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: function (result) {
          console.log("call result: " + result);
        },
        onFailure: function (err) {
          console.log("call result: " + err);
          reject(err);
        },
        inputVerificationCode() {
          console.log("call inputVerificationCode: ");
          resolve();
        },
      });
    });
  }
  // 忘记密码 修改密码
  confirmPassword(username, verificationCode, newPassword) {
    const userData = {
      Username: username,
      Pool: this.userPool,
    };
    const cognitoUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess: function (result) {
          console.log("call result: " + result);
          resolve();
        },
        onFailure: function (err) {
          console.log("call result: " + err);
          reject(err);
        },
      });
    });
  }
  // 修改密码
  changePassword(oldPassword, newPassword) {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err);
        } else {
          console.log(session);
          if (session.isValid()) {
            cognitoUser.changePassword(
              oldPassword,
              newPassword,
              (err, result) => {
                if (err) {
                  console.log(err.message || JSON.stringify(err));
                  reject(err.message);
                } else {
                  resolve();
                }
              }
            );
          }
        }
      });
    });
  }
  /**
   * 登录状态判定
   */
  isAuthenticated() {
    const cognitoUser = this.userPool.getCurrentUser();
    return new Promise((resolve, reject) => {
      if (cognitoUser === null) {
        reject(cognitoUser);
      }
      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err);
        } else {
          if (!session.isValid()) {
            reject(session);
          } else {
            resolve(session);
          }
        }
      });
    });
  }
}
Vue.use(Cognito, config);
export default new Cognito();
```

路由限制

```javascript
// @/router/index.js
import Vue from "vue";
import VueRouter from "vue-router";
import PageLayout from "@/layouts/PageLayout";
import cognito from "@/utils/cognito";

Vue.use(VueRouter);

function isAuthenticated(to, from, next) {
  cognito
    .isAuthenticated()
    .then((res) => {
      next();
    })
    .catch((e) => {
      next({
        path: "/login",
        query: {
          redirect: to.fullPath,
        },
      });
    });
}

const router = new VueRouter({
  routes: [
    {
      path: "*",
      hidden: true,
      component: () => import("views/404/index.vue"),
    },
    {
      path: "/",
      name: "layout",
      component: PageLayout,
      children: pages,
      redirect: "home",
      beforeEnter: isAuthenticated,
    },
    {
      name: "login",
      path: "/login",
      component: () => import("@/views/login/index"),
    },
  ],
});

export default router;
```

vue 实例

```javascript
// main.js
import App from "./App.vue";
import Vue from "vue";
import router from "./router/index";

import cognito from "@/utils/cognito";

new Vue({
  router,
  cognito,
  render: (h) => h(App),
}).$mount("#app");
```
