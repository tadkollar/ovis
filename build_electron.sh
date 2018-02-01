 electron-packager . OVis --platform=win32 --arch=x64 --overwrite
electron-packager . OVis --platform=linux --overwrite
electron-packager . OVis --platform=mas --overwrite
python setup.py bdist_wheel
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl OVis-linux-x64
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl OVis-mas-x64
cp dist/ZuneServerReqs-1.0-py2.py3-none-any.whl OVis-win32-x64
cp install_server_requirements.sh OVis-linux-x64
cp install_server_requirements.sh OVis-mas-x64
cp install_server_requirements.cmd OVis-win32-x64
