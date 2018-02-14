electron-packager . OVis --platform=win32 --arch=x64 --overwrite
electron-packager . OVis --platform=linux --overwrite
electron-packager . OVis --platform=mas --overwrite
rm OVis-mas-x64/OVis.app/Contents/Resources/app/build_electron.cmd
rm OVis-mas-x64/OVis.app/Contents/Resources/app/build_electron.sh
rm OVis-mas-x64/OVis.app/Contents/Resources/app/build_wheel.cmd
rm OVis-mas-x64/OVis.app/Contents/Resources/app/install_server_requirements.cmd
rm OVis-mas-x64/OVis.app/Contents/Resources/app/install_server_requirements.sh
export DEBUG=electron-osx-sign*
electron-osx-sign OVis-mas-x64/OVis.app --platform=mas --type=development --identity="Developer ID Application: NASA (82A95CK2HC)"
python setup.py bdist_wheel
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl OVis-linux-x64
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl OVis-mas-x64
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl OVis-win32-x64
cp install_server_requirements.sh OVis-linux-x64
cp install_server_requirements.sh OVis-mas-x64
cp install_server_requirements.cmd OVis-win32-x64
