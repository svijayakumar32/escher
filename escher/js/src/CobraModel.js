define(["utils", "data_styles"], function(utils, data_styles) {
    /**
     */

    var CobraModel = utils.make_class();
    // class methods
    CobraModel.build_reaction_string = build_reaction_string;
    CobraModel.genes_for_gene_reaction_rule = genes_for_gene_reaction_rule;
    CobraModel.evaluate_gene_reaction_rule = evaluate_gene_reaction_rule;
    // instance methods
    CobraModel.prototype = { init: init,
			     apply_reaction_data: apply_reaction_data,
			     apply_metabolite_data: apply_metabolite_data,
			     apply_gene_data: apply_gene_data };

    return CobraModel;

    // class methods
    function build_reaction_string(stoichiometries, is_reversible,
				   lower_bound, upper_bound) {
	/** Return a reaction string for the given stoichiometries.

	    Adapted from cobra.core.Reaction.build_reaction_string().

	    Arguments
	    ---------

	    stoichiometries: An object with metabolites as keys and
	    stoichiometries as values.

	    is_reversible: Boolean. Whether the reaction is reversible.

	    lower_bound: Reaction upper bound, to determine direction.

	    upper_bound: Reaction lower bound, to determine direction.

	*/

	var format = function(number) {
            if (number == 1)
                return "";
            return String(number) + " ";
	}
        var reactant_dict = {},
            product_dict = {},
            reactant_bits = [],
            product_bits = [];
	for (var the_metabolite in stoichiometries) {
	    var coefficient = stoichiometries[the_metabolite];
            if (coefficient > 0)
                product_bits.push(format(coefficient) + the_metabolite);
            else
                reactant_bits.push(format(Math.abs(coefficient)) + the_metabolite);
	}
        reaction_string = reactant_bits.join(' + ');
        if (is_reversible) {
            reaction_string += ' <=> ';
        } else {
            if (lower_bound < 0 && upper_bound <=0)
                reaction_string += ' <-- ';
            else
		reaction_string += ' --> ';
	}
        reaction_string += product_bits.join(' + ')
        return reaction_string
    }
    
    function genes_for_gene_reaction_rule(rule) {
	/** Find genes in gene_reaction_rule string.

	    Arguments
	    ---------

	    rule: A boolean string containing gene names, parentheses, AND's and
	    OR's.

	*/
	genes = rule
	    .replace(/(AND|OR|\(|\))/g, '')
	    .split(' ')
	    .filter(function(x) { return x != '' });
	return genes;
    }

    function check_gene_reaction_rule(rule) {
	/** Raise an error if the rule is invalid.

	    Arguments
	    ---------

	    rule: A boolean string containing gene names, parentheses, AND's and
	    OR's.

	*/
	// TODO check the rules
	return;
    }
    
    function evaluate_gene_reaction_rule(rule, gene_values) {
	/** Return a value given the rule and gene_values object.

	    Arguments
	    ---------

	    rule: A boolean string containing gene names, parentheses, AND's and
	    OR's.

	    gene_values: Object with gene_ids for keys and numbers for values.

	*/
	check_gene_reaction_rule(rule);
	
	for (var gene_id in gene_values) {
	    rule = rule.replace(gene_id, gene_values[gene_id]);
	}
	rule = rule.replace(/([^\(\)]+)AND([^\(\)]+)/g, 'Math.min($1,$2)');
	rule = rule.replace(/OR/g, '+');
	try {
	    value = eval(rule);
	} catch (e) {
	    throw new Error('Could not evaluate rule ' + rule + ': ' + e);
	}
	return value;
    }
    
    // instance methods
    function init(model_data) {
	// reactions and metabolites
	if (!(model_data.reactions && model_data.metabolites)) {
	    throw new Error('Bad model data.');
	    return;
	}
	this.reactions = {};
	for (var i=0, l=model_data.reactions.length; i<l; i++) {
	    var r = model_data.reactions[i],
		the_id = r.id;
	    this.reactions[the_id] = utils.clone(r);
	    delete this.reactions[the_id].id;
	}
	this.metabolites = {};
	for (var i=0, l=model_data.metabolites.length; i<l; i++) {
	    var r = model_data.metabolites[i],
		the_id = r.id;
	    this.metabolites[the_id] = utils.clone(r);
	    delete this.metabolites[the_id].id;
	}

	this.cofactors = ['atp', 'adp', 'nad', 'nadh', 'nadp', 'nadph', 'gtp',
			  'gdp', 'h'];
    }

    function apply_reaction_data(reaction_data, styles) {
	/** Apply data to model. This is only used to display options in
	    BuildInput.
	    
	    apply_reaction_data overrides apply_gene_data.

	*/

	for (var reaction_id in this.reactions) {
	    var reaction = this.reactions[reaction_id];
	    if (reaction_data===null) {
		reaction.data = null;
		reaction.data_string = '';
	    } else {
		var d = (reaction_id in reaction_data ?
			 reaction_data[reaction_id] : null),
		    f = data_styles.float_for_data(d, styles),
		    s = data_styles.text_for_data(d, styles);
		reaction.data = f;
		reaction.data_string = s;
	    }
	}
    }

    function apply_metabolite_data(metabolite_data, styles) {
	/** Apply data to model. This is only used to display options in
	    BuildInput.

	 */
	for (var metabolite_id in this.metabolites) {
	    var metabolite = this.metabolites[metabolite_id];
	    if (metabolite_data===null) {
		metabolite.data = null;
		metabolite.data_string = '';
	    } else {
		var d = (metabolite_id in metabolite_data ?
			 metabolite_data[metabolite_id] : null),
		    f = data_styles.float_for_data(d, styles),
		    s = data_styles.text_for_data(d, styles);
		metabolite.data = f;
		metabolite.data_string = s;
	    }
	}
    }

    
    function apply_gene_data(gene_data_obj, styles) {
	/** Apply data to model. This is only used to display options in
	    BuildInput.

	    apply_gene_data overrides apply_reaction_data.

	    Arguments
	    ---------

	    gene_data_obj: The gene data object, with the following style:

	    { reaction_id: { rule: 'rule_string', genes: { gene_id: value } } }

	    style: Gene styles array.

	*/
	for (var reaction_id in this.reactions) {
	    // var gene = this.genes[gene_id],
	    // 	reaction_ids = utils.
	    if (gene_data===null) {
		reaction.data = null;
		reaction.data_string = '';
	    } else {
		var d = (reaction_id in gene_data_obj ?
			 evaluate_gene_reaction_rule(gene_data_obj[reaction_id]) :
			 null),
		    f = data_styles.float_for_data(d, styles),
		    s = data_styles.text_for_data(d, styles);
		reaction.data = f;
		reaction.data_string = s;
	    }
	}
    }
});
