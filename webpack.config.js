/**
 * Created by liuyufei on 13/07/18.
 */
module.exports =(env) => {
	return require(`./webpack.${env}.js`)
}