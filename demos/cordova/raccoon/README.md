# Raccoon IOS App

The installation here has been tested on:
- Macbook pro with MacOSX Sierre 10.14 and XCode 11.2 beta
- Iphone XR with IOS 13.2


## Install the prerequisites
You need to install first *Homebrew* and *npm* (not detailed here).
Then install *ionic*, *cordova*:

```
sudo npm install -g ionic
sudo npm install -g cordova
brew install ios-deploy
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

(The npm install of *ios-deploy* was not working for me).


## Build App

Go to this directory, then run:

```
ionic cordova platform add ios@5.0.1
npm install
ionic cordova build ios
```

The build will stop because of development team settings.
Open the project with Xcode:
```
open platforms/ios/MyApp.xcodeproj
```

## In Xcode

1. Changed bundle identifier to `io.jeeliz.whatever` in *General* tab/*Identity* section
2. In *General* tab/*Deployment Info*, set the Target option to the right iOS version (13.2 in my case)
1. in *Build Settings* tab, go to *Signing*, ensure you have a legitimate Team set up (it can be a *Personal Team* if you don't have a paid Apple Developer access),
2. Ensure device is plugged and trusted then click on *Product*/*Destination* and set *Device/Iphone*
3. Unlock the iphone and click on *Product*/*Run*

Then on device:
* The icon of the app labeled with *MyApp* should pop up on the phone.
* When you click on it, if you got an alert box saying that you are not allowed to open it, go to *settings* / *general* / *Profiles & Device Management* / *Apple dev: ...* and click on *Trust apple development: ....*
* Re-run the app from XCode (or click again on the icon)

