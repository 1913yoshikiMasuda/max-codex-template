{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 9,
      "minor": 0,
      "revision": 0,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [100.0, 100.0, 520.0, 520.0],
    "gridonopen": 1,
    "gridsize": [20.0, 20.0],
    "gridsnaponopen": 1,
    "boxes": [
      {
        "box": {
          "id": "obj-1",
          "maxclass": "comment",
          "text": "Safe test tone: attenuate before enabling audio output",
          "patching_rect": [120.0, 40.0, 340.0, 22.0]
        }
      },
      {
        "box": {
          "id": "obj-2",
          "maxclass": "newobj",
          "text": "cycle~ 440",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": ["signal"],
          "patching_rect": [200.0, 100.0, 80.0, 22.0],
          "varname": "test_tone"
        }
      },
      {
        "box": {
          "id": "obj-3",
          "maxclass": "gain~",
          "numinlets": 2,
          "numoutlets": 2,
          "outlettype": ["signal", ""],
          "parameter_enable": 0,
          "patching_rect": [200.0, 180.0, 48.0, 120.0],
          "varname": "master_gain"
        }
      },
      {
        "box": {
          "id": "obj-4",
          "maxclass": "ezdac~",
          "numinlets": 2,
          "numoutlets": 0,
          "patching_rect": [200.0, 360.0, 48.0, 48.0],
          "varname": "audio_output"
        }
      }
    ],
    "lines": [
      { "patchline": { "source": ["obj-2", 0], "destination": ["obj-3", 0] } },
      { "patchline": { "source": ["obj-3", 0], "destination": ["obj-4", 0] } },
      { "patchline": { "source": ["obj-3", 0], "destination": ["obj-4", 1] } }
    ]
  }
}
