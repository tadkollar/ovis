from setuptools import setup

setup(
    name='ZuneServerReqs',
    version='1.0',
    description='Zune server for OpenMDAO',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Science/Research',
        'Natural Language :: English',
        'Operating System :: MacOS :: MacOS X',
        'Operating System :: POSIX :: Linux',
        'Operating System :: Microsoft :: Windows',
        'Topic :: Scientific/Engineering',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: Implementation :: CPython',
    ],
    install_requires=[
        'six',
        'tornado',
        'requests_mock',
        'sqlitedict',
        'pymongo',
        'python-dateutil',
        'numpy',
        'minimock'
    ]
)