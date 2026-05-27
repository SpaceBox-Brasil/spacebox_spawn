fx_version 'cerulean'
game 'gta5'

name 'spacebox_spawn'
description 'Sistema de spawn com NUI moderna baseada em shadcn/ui'
author 'SpaceBox Team'
version '1.0.0'

ox_lib 'locale'

shared_scripts {
	'@ox_lib/init.lua',
}

client_scripts {
	'client/main.lua',
	'client/camera.lua',
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'server/main.lua',
}

ui_page 'html/dist/index.html'

files {
	'html/index.html',
	'html/dist/**/*',
	'config/client.lua',
	'locales/*.json'
}

lua54 'yes'
use_experimental_fxv2_oal 'yes'

